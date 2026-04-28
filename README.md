# 🛡️ Cyber Kavach

> **Real-Time Cloud Threat Detection & Response Agent**  
> *Detect. Respond. Alert. — Before the damage is done.*

---

## 🚨 What is Cyber Kavach?

Cyber Kavach is a lightweight, always-active, host-based intrusion detection and response system built for cloud environments. It runs as a set of Docker containers, continuously monitoring your system for active cyber threats and responding to them in real time — no human in the loop required.

**We don't wait for breaches to be analyzed. We stop them while they're happening.**

---

## 🎯 Problem

Cloud systems are always running — and so are attacks.

- Developers deploy applications with minimal active monitoring
- Traditional tools (Splunk, Snort) are too heavy for lightweight cloud deployments
- Most systems only **log** attacks, not **stop** them
- By the time an alert reaches a human, damage is already done

---

## ✅ Solution

A modular, real-time host-based intrusion detection and response system with explainable alerts and an automated remediation pipeline.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     HOST MACHINE                        │
│  /var/log/auth.log  │  /proc  │  netstat / ss           │
└──────────────┬──────────────────────────────────────────┘
               │ reads (--network host)
               ▼
┌──────────────────────────┐
│   Agent Container        │  (Python)
│  ┌────────────────────┐  │
│  │ brute_force.py     │  │
│  │ reverse_shell.py   │  │  → Detects
│  │ network_monitor.py │  │
│  └────────┬───────────┘  │
│           │              │
│  responder.py            │  → Blocks IP / Kills Process
│  sender.py               │  → POST /alerts
└──────────────────────────┘
               │ HTTP POST /alerts
               ▼
┌──────────────────────────┐        ┌──────────────────────┐
│   Backend Container      │──WS──▶│  Frontend Container  │
│   (FastAPI)              │        │  (HTML/CSS/JS)       │
│                          │        │                      │
│  POST  /alerts           │        │  Live Alert Feed     │
│  GET   /alerts           │        │  Severity Badges     │
│  WS    /ws               │        │  Attack Timeline     │
│  GET   /health           │        │  Agent Status        │
│  email_notifier.py       │        └──────────────────────┘
│  alerts.json (backup)    │
└──────────────────────────┘
               │ SMTP
               ▼
          📧 Email Alert
```

---

## 🔍 Detection Modules

| Module | Watches | Threat | Severity |
|---|---|---|---|
| `brute_force.py` | `/var/log/auth.log` | Repeated failed SSH logins (≥5 in 60s) | MEDIUM |
| `reverse_shell.py` | `ps`, `/proc`, `netstat` | `bash/nc/python` with outbound TCP on suspicious port | HIGH |
| `network_monitor.py` | `ss -tnp` / `netstat` | Connections to blacklisted IPs / high frequency traffic | MEDIUM |

---

## ⚡ Detection Event Pipeline

```
Detector → Event → Responder → Notifier
```

Each detection goes through a unified pipeline — not ad-hoc scripts. This makes the system extensible: adding a new detector is as simple as dropping a new module in `detectors/`.

---

## 📦 Alert Payload (Unified Format)

Every alert, regardless of source, follows this structure:

```json
{
  "id": "uuid",
  "type": "reverse_shell",
  "severity": "HIGH",
  "ip": "192.168.1.100",
  "process": "bash",
  "action": "SIMULATED_KILL",
  "reason": "bash process with outbound TCP connection on port 4444",
  "timestamp": "2026-04-24T12:00:00Z"
}
```

---

## 🐳 Docker Services

| Service | Language | Port | Role |
|---|---|---|---|
| `agent` | Python | — | Detection + Response (host network) |
| `backend` | FastAPI | 8000 | API + WebSocket + Email relay |
| `frontend` | HTML/JS | 3000 | Live dashboard |

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- A Linux host (for real log monitoring)
- Gmail app password (for email alerts)

### 1. Clone the repo
```bash
git clone https://github.com/your-org/Cyber-Kavach.git
cd Cyber-Kavach
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your SMTP credentials
```

### 3. Launch
```bash
docker-compose up --build
```

### 4. Open dashboard
```
http://localhost:3000
```

---

## 🎬 Demo Flow

| Step | Action | Expected Result |
|---|---|---|
| 1 | Run brute force simulation script | Dashboard shows MEDIUM alert, email sent |
| 2 | Spawn `nc` reverse shell listener | Dashboard shows HIGH alert, process flagged |
| 3 | Feed suspicious IP to network monitor | Dashboard shows network alert |

Simulation scripts are in `scripts/simulate/`.

---

## 📁 Folder Structure

```
Cyber-Kavach/
├── agent/
│   ├── detectors/
│   │   ├── brute_force.py
│   │   ├── reverse_shell.py
│   │   └── network_monitor.py
│   ├── responder.py
│   ├── sender.py
│   ├── main.py
│   └── Dockerfile
├── backend/
│   ├── main.py
│   ├── email_notifier.py
│   ├── alerts.json
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── Dockerfile
├── scripts/
│   └── simulate/
│       ├── brute_force_sim.sh
│       └── reverse_shell_sim.sh
├── docs/
│   └── PRD.md
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 🔥 USP

> Unlike traditional tools that only detect and log, Cyber Kavach **actively stops attacks in real time** with lightweight, automated defense directly at the host level — with full explainability on every alert.

---

## 🛡️ Built For

- DevSecOps teams
- Small-scale cloud deployments
- Developer-friendly runtime security
- Hackathon demonstrations of real security principles

---

## 👥 Team

Built at a Cybersecurity Hackathon · DevSecOps Track · 2026
