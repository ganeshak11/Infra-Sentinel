# ⚙️ Backend — API, Alerts & Notifications

**Owner:** Nithish  
**Stack:** Python 3.11 + FastAPI + Uvicorn  
**Port:** `8000`

---

## What This Folder Does

The backend is the **central hub**. It:
- Receives alerts from the agent
- Stores them in memory + JSON file
- Pushes live alerts to the dashboard via WebSocket
- Sends email notifications on each new alert
- Responds to heartbeat pings from the agent

---

## Folder Structure

```
backend/
├── main.py              ← FastAPI app — all routes + WebSocket
├── email_notifier.py    ← Sends email on new alert
├── alerts.json          ← Persisted alerts backup (auto-created)
├── requirements.txt
└── Dockerfile
```

---

## What to Build

### `main.py`

FastAPI app with these endpoints:

#### `POST /alerts`
- Receives alert JSON from agent
- Appends to in-memory list
- Writes to `alerts.json`
- Calls `email_notifier.send_email(alert)`
- Broadcasts alert to all connected WebSocket clients
- Returns `{"status": "ok"}`

#### `GET /alerts`
- Returns full list of alerts stored in memory
- Supports optional query param: `?severity=HIGH`

#### `WebSocket /ws`
- Dashboard connects here
- On new alert → push it to all connected clients
- Keep a global list of active WebSocket connections

#### `GET /health`
- Returns `{"status": "ok", "timestamp": "..."}`
- Agent pings this every 30s

---

### `email_notifier.py`

- Uses Python `smtplib` + `ssl`
- On each new alert, sends an email to `ALERT_EMAIL`
- Subject: `[Cyber Kavach] {severity} Alert — {type}`
- Body: Formatted alert details (not raw JSON — make it readable)
- Example:

```
🚨 Cyber Kavach Alert

Type:      reverse_shell
Severity:  HIGH
Source IP: 192.168.1.100
Process:   bash
Action:    SIMULATED_KILL
Reason:    bash process with outbound TCP on port 4444
Time:      2026-04-24T12:00:00Z
```

---

## In-Memory + JSON Storage

```python
alerts = []  # in-memory

# On new alert:
alerts.append(alert)
with open("alerts.json", "w") as f:
    json.dump(alerts, f, indent=2)

# On startup, load from file:
if os.path.exists("alerts.json"):
    with open("alerts.json") as f:
        alerts = json.load(f)
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server (`smtp.gmail.com`) |
| `SMTP_PORT` | Port (`587`) |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail app password |
| `ALERT_EMAIL` | Destination email address |

---

## Key Libraries

```txt
fastapi
uvicorn[standard]
python-dotenv
```

---

## Running Locally (without Docker)

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## CORS

Add CORS middleware to allow the frontend container to connect:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
