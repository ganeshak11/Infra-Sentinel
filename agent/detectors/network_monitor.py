"""
network_monitor.py — Module 3: Suspicious Network Behaviour Detection

Detects 3 kinds of malicious network activity from host connections:

  1. Blacklist Match    — Active connection to/from a known-bad IP (blacklist.txt)
  2. Port Scan         — Same remote IP touched >= PORT_SCAN_THRESHOLD distinct
                         local ports within PORT_SCAN_WINDOW seconds
  3. Connection Flood  — Same remote IP has >= FLOOD_THRESHOLD simultaneous
                         established connections to this host

Every SCAN_INTERVAL seconds the detector reads all ESTABLISHED host TCP
connections via `ss -tnp` and runs the three checks.  Any hit fires an alert
and triggers iptables blocking via the shared responder.
"""

import os
import re
import time
import uuid
import subprocess
import logging
from collections import defaultdict
from datetime import datetime, timezone

from responder import respond
from sender import send_alert

logger = logging.getLogger("detector.network_monitor")

# ── Tuneable thresholds ───────────────────────────────────────────────────────
SCAN_INTERVAL        = 10   # seconds between each full scan
PORT_SCAN_THRESHOLD  = 10   # distinct local ports from one remote IP → port scan
PORT_SCAN_WINDOW     = 60   # seconds to accumulate port-touch history
FLOOD_THRESHOLD      = 20   # simultaneous connections from one remote IP → flood

# ── Paths ─────────────────────────────────────────────────────────────────────
BLACKLIST_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "blacklist.txt")
)

# ── Private IPs to ignore (loopback, RFC-1918, link-local, Docker) ────────────
_PRIVATE_RE = re.compile(
    r"^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|0\.0\.0\.0)"
)


def _is_private(ip: str) -> bool:
    return bool(_PRIVATE_RE.match(ip))


# ── Blacklist loader ───────────────────────────────────────────────────────────
def _load_blacklist() -> set:
    bl: set = set()
    try:
        with open(BLACKLIST_PATH) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    bl.add(line)
        logger.debug("Blacklist loaded: %d IPs", len(bl))
    except FileNotFoundError:
        logger.warning("Blacklist not found at %s — running without it.", BLACKLIST_PATH)
    return bl


# ── Connection reader ──────────────────────────────────────────────────────────
def _get_connections():
    """
    Returns list of (remote_ip, remote_port, local_port) tuples for all
    ESTABLISHED TCP connections visible on the host.
    Uses `ss -tnp`; falls back to `netstat -tnp`.
    """
    connections = []
    try:
        result = subprocess.run(
            ["ss", "-tnp"], capture_output=True, text=True, timeout=10
        )
        lines = result.stdout.splitlines()
    except FileNotFoundError:
        try:
            result = subprocess.run(
                ["netstat", "-tnp"], capture_output=True, text=True, timeout=10
            )
            lines = result.stdout.splitlines()
        except FileNotFoundError:
            logger.error("Neither ss nor netstat found — network monitor disabled.")
            return connections

    # ss output columns: State Recv-Q Send-Q Local:Port Peer:Port [Process]
    for line in lines:
        if "ESTAB" not in line and "ESTABLISHED" not in line:
            continue
        parts = line.split()
        if len(parts) < 5:
            continue
        try:
            local_addr  = parts[3] if "ss" in result.args[0] else parts[3]
            remote_addr = parts[4] if "ss" in result.args[0] else parts[4]
            local_port  = int(local_addr.rsplit(":", 1)[-1])
            remote_ip   = remote_addr.rsplit(":", 1)[0].strip("[]")
            remote_port = int(remote_addr.rsplit(":", 1)[-1])
            connections.append((remote_ip, remote_port, local_port))
        except (ValueError, IndexError):
            continue
    return connections


# ── Main loop ─────────────────────────────────────────────────────────────────
def start_network_monitor(config: dict):
    """
    Entry point launched by main.py in its own daemon thread.

    config keys:
        backend_url (str)
        demo_mode   (bool)
    """
    logger.info(
        "Network monitor started — blacklist=%s  port_scan=%d ports/%ds  flood=%d conns",
        BLACKLIST_PATH, PORT_SCAN_THRESHOLD, PORT_SCAN_WINDOW, FLOOD_THRESHOLD,
    )

    # Per-IP port-touch history: ip → list of (timestamp, local_port)
    port_history: defaultdict = defaultdict(list)
    # IPs already alerted this cycle (reset each scan)
    alerted_this_scan: set = set()

    def _fire(alert: dict):
        """Respond + send and mark as alerted."""
        alerted_this_scan.add(alert["ip"])
        logger.warning("🚨 NETWORK ALERT — %s", alert["reason"])
        respond(alert, config)
        send_alert(alert, config)

    while True:
        blacklist = _load_blacklist()
        alerted_this_scan.clear()
        now = time.time()

        try:
            connections = _get_connections()

            # Count same-IP connections (flood detection)
            flood_counter: defaultdict = defaultdict(int)
            for remote_ip, _, _ in connections:
                if not _is_private(remote_ip):
                    flood_counter[remote_ip] += 1

            # Purge stale port-scan history entries
            for ip in list(port_history.keys()):
                port_history[ip] = [
                    (ts, lp)
                    for ts, lp in port_history[ip]
                    if now - ts < PORT_SCAN_WINDOW
                ]

            for remote_ip, remote_port, local_port in connections:
                if _is_private(remote_ip):
                    continue
                if remote_ip in alerted_this_scan:
                    continue

                # ── Check 1: Blacklist match ───────────────────────────────
                if remote_ip in blacklist:
                    _fire({
                        "id":        str(uuid.uuid4()),
                        "type":      "network_anomaly",
                        "severity":  "HIGH",
                        "ip":        remote_ip,
                        "process":   None,
                        "action":    None,
                        "reason":    (
                            f"Connection to blacklisted IP {remote_ip}:{remote_port} "
                            f"(matched blacklist.txt)"
                        ),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    continue

                # ── Check 2: Connection flood ──────────────────────────────
                if flood_counter[remote_ip] >= FLOOD_THRESHOLD:
                    _fire({
                        "id":        str(uuid.uuid4()),
                        "type":      "network_anomaly",
                        "severity":  "HIGH",
                        "ip":        remote_ip,
                        "process":   None,
                        "action":    None,
                        "reason":    (
                            f"Connection flood from {remote_ip}: "
                            f"{flood_counter[remote_ip]} simultaneous connections "
                            f"(threshold: {FLOOD_THRESHOLD})"
                        ),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    continue

                # ── Check 3: Port scan ─────────────────────────────────────
                port_history[remote_ip].append((now, local_port))
                distinct_ports = {lp for _, lp in port_history[remote_ip]}
                if len(distinct_ports) >= PORT_SCAN_THRESHOLD:
                    _fire({
                        "id":        str(uuid.uuid4()),
                        "type":      "network_anomaly",
                        "severity":  "MEDIUM",
                        "ip":        remote_ip,
                        "process":   None,
                        "action":    None,
                        "reason":    (
                            f"Port scan detected from {remote_ip}: "
                            f"touched {len(distinct_ports)} distinct local ports "
                            f"in the last {PORT_SCAN_WINDOW}s "
                            f"(threshold: {PORT_SCAN_THRESHOLD})"
                        ),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    # Clear history for this IP after alerting to avoid repeat storms
                    port_history[remote_ip].clear()

        except Exception as exc:
            logger.error("Network monitor scan error: %s", exc, exc_info=True)

        time.sleep(SCAN_INTERVAL)
