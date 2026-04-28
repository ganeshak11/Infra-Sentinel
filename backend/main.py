"""
main.py — Cyber Kavach Backend
FastAPI app: alert ingestion, WebSocket broadcasting, email notifications.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from email_notifier import send_email

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("cyber-kavach.api")

ALERTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alerts.json")

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------
alerts: List[dict] = []
active_connections: List[WebSocket] = []

# Load persisted alerts on startup
if os.path.exists(ALERTS_FILE):
    try:
        with open(ALERTS_FILE, "r") as f:
            alerts = json.load(f)
        logger.info("Loaded %d persisted alerts from %s", len(alerts), ALERTS_FILE)
    except (json.JSONDecodeError, IOError) as exc:
        logger.warning("Could not load alerts.json — starting fresh: %s", exc)
        alerts = []

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Cyber Kavach Backend",
    description="Central hub for alert ingestion, WebSocket broadcasting, and email notifications.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _persist_alerts() -> None:
    """Write the current alerts list to alerts.json."""
    try:
        with open(ALERTS_FILE, "w") as f:
            json.dump(alerts, f, indent=2)
    except IOError as exc:
        logger.error("Failed to persist alerts: %s", exc)


async def _broadcast(alert: dict) -> None:
    """Push the alert to every connected WebSocket client."""
    disconnected: List[WebSocket] = []
    for ws in active_connections:
        try:
            await ws.send_json(alert)
        except Exception:
            disconnected.append(ws)
    # Clean up dead connections
    for ws in disconnected:
        active_connections.remove(ws)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/alerts")
async def create_alert(alert: dict):
    """
    Receive an alert from the agent.
    - Appends to in-memory list
    - Persists to alerts.json
    - Sends email notification
    - Broadcasts to WebSocket clients
    """
    logger.info("New alert received — type=%s severity=%s",
                alert.get("type"), alert.get("severity"))

    alerts.append(alert)
    _persist_alerts()

    # Email (fire-and-forget; errors are logged, never raised)
    send_email(alert)

    # WebSocket broadcast
    await _broadcast(alert)

    return {"status": "ok"}


@app.get("/alerts")
async def get_alerts(severity: Optional[str] = Query(None)):
    """
    Return all alerts. Optionally filter by severity (e.g. ?severity=HIGH).
    """
    if severity:
        filtered = [a for a in alerts if a.get("severity", "").upper() == severity.upper()]
        return filtered
    return alerts


@app.get("/attackers")
async def get_attackers():
    """
    Aggregate attacker IPs from stored alerts.
    Returns ranked list: [{ ip, count, last_seen, type, severity }]
    """
    from collections import defaultdict
    tracker = defaultdict(lambda: {"count": 0, "last_seen": None, "type": None, "severity": None})

    for alert in alerts:
        ip = alert.get("ip")
        if not ip:
            continue
        # Satisfy type checker by ensuring count is treated as int
        current = tracker[ip]["count"]
        tracker[ip]["count"] = (int(current) if current is not None else 0) + 1
        ts = alert.get("timestamp")
        if tracker[ip]["last_seen"] is None or (ts and ts > tracker[ip]["last_seen"]):
            tracker[ip]["last_seen"] = ts
            tracker[ip]["type"] = alert.get("type", "unknown")
            tracker[ip]["severity"] = alert.get("severity", "MEDIUM")

    result = [
        {"ip": ip, **data}
        for ip, data in sorted(tracker.items(), key=lambda x: -x[1]["count"])
    ]
    return result


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    Dashboard connects here.
    On connection: added to active list.
    On disconnect: removed from active list.
    New alerts are pushed in real-time via _broadcast().
    """
    await ws.accept()
    active_connections.append(ws)
    logger.info("WebSocket client connected — total: %d", len(active_connections))
    try:
        while True:
            # Keep the connection alive; we only push, but need to read to detect disconnect
            await ws.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(ws)
        logger.info("WebSocket client disconnected — total: %d", len(active_connections))


@app.get("/health")
async def health():
    """Heartbeat endpoint — agent pings this every 30s."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
