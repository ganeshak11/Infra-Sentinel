# 🤖 Agent — Detection & Response Core

**Owner:** Keerthi
**Stack:** Python 3.11  
**Docker:** Yes — runs with `--network host` (required for host log/process access)

---

## What This Folder Does

The agent is the **brain of Cyber Kavach**. It runs continuously on the cloud host, reads system logs and processes, detects attacks, takes automated responses, and sends alerts to the backend.

---

## Folder Structure

```
agent/
├── detectors/
│   ├── brute_force.py       ← Module 1: SSH brute force detection
│   ├── reverse_shell.py     ← Module 2: Reverse shell detection
│   └── network_monitor.py  ← Module 3: Suspicious network activity
├── responder.py             ← Takes action (block IP / kill process)
├── sender.py                ← POSTs alert to backend API
├── main.py                  ← Entry point — starts all detector loops
├── requirements.txt
└── Dockerfile
```

---

## What to Build

### `main.py`
- Start 3 detector threads (one per module)
- Send heartbeat `GET /health` to backend every 30s
- Read config from environment variables

### `detectors/brute_force.py`
- Tail `/var/log/auth.log` continuously
- Count failed SSH logins per IP in a rolling 60-second window
- If count ≥ `BRUTE_THRESHOLD` (default: 5) → trigger alert
- Use a dict to track `{ip: [timestamps]}`

### `detectors/reverse_shell.py`
- Every 5s, scan running processes (`ps aux`)
- For each suspicious process (`bash`, `sh`, `nc`, `python`, `perl`), check its active network connections (`/proc/<pid>/net/tcp`)
- If the process has an established outbound TCP connection on a non-standard port (not 22, 80, 443) → trigger alert

### `detectors/network_monitor.py`
- Every 10s, read active connections via `ss -tnp` or `netstat`
- Compare destination IPs against a `blacklist.txt` file
- If a match → trigger alert

### `responder.py`
- Receives an alert dict
- If `DEMO_MODE=true`: log the action, don't execute it
- If not demo mode:
  - `IP_BLOCK` → `iptables -A INPUT -s <IP> -j DROP`
  - `KILL_PROCESS` → `os.kill(pid, signal.SIGKILL)`
- Adds `action` field to alert before sending

### `sender.py`
- `POST` the alert JSON to `BACKEND_URL/alerts`
- Retry once on failure
- Log success/failure

---

## Alert Format

Every alert must follow this exact structure:

```json
{
  "id": "uuid4",
  "type": "brute_force | reverse_shell | network_anomaly",
  "severity": "LOW | MEDIUM | HIGH",
  "ip": "x.x.x.x",
  "process": "bash (optional)",
  "action": "IP_BLOCKED | SIMULATED_BLOCK | PROCESS_KILLED | SIMULATED_KILL",
  "reason": "Human-readable explanation of why this was flagged",
  "timestamp": "ISO 8601"
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://backend:8000` | Where to POST alerts |
| `DEMO_MODE` | `true` | Simulate responses |
| `BRUTE_THRESHOLD` | `5` | Failed logins to trigger |
| `BRUTE_WINDOW` | `60` | Rolling window in seconds |

---

## Key Libraries

```txt
requests
psutil
python-dotenv
```

---

## Running Locally (without Docker)

```bash
pip install -r requirements.txt
BACKEND_URL=http://localhost:8000 DEMO_MODE=true python main.py
```
