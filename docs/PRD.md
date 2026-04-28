# 📋 Product Requirements Document (PRD)
## Cyber Kavach — Real-Time Cloud Threat Detection & Response Agent

**Version:** 1.0  
**Date:** 2026-04-24  
**Track:** DevSecOps — Cybersecurity Hackathon  
**Status:** Approved for Implementation

---

## 1. Executive Summary

Cyber Kavach is a lightweight, always-active, host-based intrusion detection and response (HIDR) system designed for cloud environments. It continuously monitors system behavior, detects active threats, takes automated remediation actions, and notifies operators in real time — bridging the gap between passive logging and active cloud defense.

---

## 2. Problem Statement

### 2.1 Context
Modern cloud environments run 24/7, making them persistent targets for automated attacks. Developers are increasingly responsible for securing their own deployments, but they lack practical, lightweight tools that fit inside a DevSecOps workflow.

### 2.2 Core Problem
> There is no lightweight, always-active security layer that lives inside cloud environments, continuously watching for suspicious behavior and responding instantly — before an attack escalates.

### 2.3 Current Gaps

| Gap | Impact |
|---|---|
| Tools like Splunk/Snort require heavy setup | Not viable for small/fast cloud deployments |
| Most monitoring is passive (logs only) | Attacks detected after the damage is done |
| No unified alert format across threat types | Hard to build automated response on top |
| Developers skip security monitoring entirely | Silent breaches, delayed discovery |

---

## 3. Goals & Non-Goals

### ✅ Goals
- Detect brute-force SSH attacks in real time
- Detect reverse shell execution via process + network analysis
- Detect suspicious outbound network connections
- Auto-respond: block attacker IP, terminate suspicious process
- Notify operators via live dashboard + email
- Maintain an explainable, unified alert format

### ❌ Non-Goals
- Full SIEM replacement (not a Splunk competitor)
- ML/AI-based detection (rule-based only for v1)
- Windows support (Linux hosts only)
- Kubernetes-level orchestration
- External vulnerability scanning (network perimeter)

---

## 4. User Personas

### 4.1 Primary: DevSecOps Engineer
- Deploys apps on cloud VMs
- Wants security without managing a full SIEM
- Needs alerts that explain *why* something was flagged

### 4.2 Secondary: Small Team Lead
- Limited security budget
- Needs something lightweight that "just works"
- Values automation over manual review

---

## 5. Functional Requirements

### 5.1 Detection Engine

#### FR-01: Brute Force Detection
- **Input:** `/var/log/auth.log`
- **Rule:** ≥5 failed SSH login attempts from the same IP within a 60-second rolling window
- **Output:** Alert with type `brute_force`, severity `MEDIUM`

#### FR-02: Reverse Shell Detection
- **Input:** Running processes (`ps`), `/proc` filesystem, active connections (`netstat`/`ss`)
- **Rule:** A process (`bash`, `sh`, `nc`, `python`, `perl`) with an established outbound TCP connection on a non-standard port (outside 80, 443, 22)
- **Output:** Alert with type `reverse_shell`, severity `HIGH`

#### FR-03: Suspicious Network Activity
- **Input:** Active outbound connections
- **Rule:** Connection to a known blacklisted IP, or unusually high connection frequency from a single process
- **Output:** Alert with type `network_anomaly`, severity `MEDIUM`

#### FR-04: Heartbeat
- Agent sends a `GET /health` ping to backend every 30 seconds
- Dashboard shows green "Agent Online" / red "Agent Offline" indicator

---

### 5.2 Response Engine

#### FR-05: IP Block
- On brute_force or network_anomaly detection
- Action: Simulate `iptables -A INPUT -s <IP> -j DROP`
- Field in alert: `"action": "IP_BLOCKED"` or `"action": "SIMULATED_BLOCK"`

#### FR-06: Process Termination
- On reverse_shell detection
- Action: Simulate `kill -9 <PID>`
- Field in alert: `"action": "SIMULATED_KILL"`

> **Note:** Actions are simulated (logged, not executed) in demo mode to prevent demo environment disruption. A `DEMO_MODE=true` env var controls this.

---

### 5.3 Alerting & Notification

#### FR-07: Unified Alert Format
Every alert must conform to this schema:
```json
{
  "id": "string (uuid)",
  "type": "brute_force | reverse_shell | network_anomaly",
  "severity": "LOW | MEDIUM | HIGH",
  "ip": "string",
  "process": "string (optional)",
  "action": "string",
  "reason": "string (human-readable explanation)",
  "timestamp": "ISO 8601"
}
```

#### FR-08: Backend API
| Endpoint | Method | Description |
|---|---|---|
| `/alerts` | POST | Receive alert from agent |
| `/alerts` | GET | Return all stored alerts |
| `/ws` | WS | Push live alerts to dashboard |
| `/health` | GET | Return agent heartbeat status |

#### FR-09: Email Notification
- Triggered on every new alert
- Via SMTP (Gmail app password)
- Subject: `[Cyber Kavach] {severity} Alert — {type}`
- Body: Full alert payload in human-readable format

#### FR-10: Alert Persistence
- Alerts stored in memory during runtime
- Backed up to `alerts.json` on write
- Loaded from `alerts.json` on backend restart

---

### 5.4 Dashboard

#### FR-11: Live Alert Feed
- Real-time via WebSocket
- Columns: Timestamp | Type | Severity | Source IP | Action | Reason

#### FR-12: Severity Badges
- HIGH → red badge
- MEDIUM → orange badge
- LOW → yellow badge

#### FR-13: Attack Timeline
- Chronological list of events
- Format: `[HH:MM:SS] <type> detected from <ip> — <action>`

#### FR-14: Summary Counters
- Total threats detected (session)
- Breakdown by type: Brute Force / Reverse Shell / Network
- Threats blocked counter

#### FR-15: Agent Status Indicator
- Green pill: "Agent Online"
- Red pill: "Agent Offline" (no heartbeat for >60s)

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Detection latency | < 5 seconds from attack to dashboard alert |
| Agent CPU usage | < 5% on idle |
| Backend response time | < 200ms for `/alerts` GET |
| Demo stability | Zero crashes during 5-minute demo window |
| Container startup | All 3 containers up in < 30 seconds |

---

## 7. System Architecture

### 7.1 Components

| Component | Tech | Docker Mode | Port |
|---|---|---|---|
| Agent | Python 3.11 | `--network host` | — |
| Backend | FastAPI + Uvicorn | bridge | 8000 |
| Frontend | HTML/CSS/JS (nginx) | bridge | 3000 |

### 7.2 Inter-Service Communication
- Agent → Backend: HTTP POST `/alerts`
- Backend → Frontend: WebSocket `/ws`
- Backend → Email: SMTP

### 7.3 Data Flow
```
Host OS → Agent (detect) → Agent (respond) → Backend (store + emit) → Dashboard
                                                      └──────────────────→ Email
```

---

## 8. Team Ownership

| Component | Folder | Owner |
|---|---|---|
| Detection Agent | `agent/` | _(teammate A)_ |
| Backend API | `backend/` | _(teammate B)_ |
| Frontend Dashboard | `frontend/` | _(teammate C)_ |
| Docker / Infra | root `docker-compose.yml` | **Ganesh** |
| Demo Scripts | `scripts/simulate/` | _(shared)_ |

> Each folder has its own `README.md` with detailed build instructions.

---

## 9. Demo Requirements

### 9.1 Demo Scenarios

| Scenario | Script | Expected Outcome |
|---|---|---|
| Brute Force | `scripts/simulate/brute_force_sim.sh` | MEDIUM alert, email sent |
| Reverse Shell | `scripts/simulate/reverse_shell_sim.sh` | HIGH alert, process flagged |
| Network Anomaly | `scripts/simulate/network_anomaly_sim.sh` | MEDIUM alert |

### 9.2 Demo Mode
- `DEMO_MODE=true` in `.env`
- Responses are logged/simulated, not executed
- All other detection and alerting is fully real

---

## 10. Environment Variables

| Variable | Description | Example |
|---|---|---|
| `BACKEND_URL` | Agent → Backend URL | `http://backend:8000` |
| `SMTP_HOST` | Email SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Gmail address | `you@gmail.com` |
| `SMTP_PASS` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `ALERT_EMAIL` | Destination email | `team@example.com` |
| `DEMO_MODE` | Simulate responses | `true` |
| `BRUTE_THRESHOLD` | Failed logins to trigger | `5` |
| `BRUTE_WINDOW` | Rolling window (seconds) | `60` |

---

## 11. Success Criteria

| Criterion | How Verified |
|---|---|
| Brute force detected & alerted in <5s | Live demo |
| Reverse shell process flagged correctly | Live demo |
| Dashboard updates in real time | Live demo |
| Email received on alert trigger | Live demo |
| All 3 containers start with `docker-compose up` | Build test |
| Alert format consistent across all modules | Code review |

---

## 12. Pitch Line

> *"We shift security left all the way to runtime — a modular, real-time host-based intrusion detection and response system with explainable alerts and an automated remediation pipeline. We don't monitor threats. We stop them."*
