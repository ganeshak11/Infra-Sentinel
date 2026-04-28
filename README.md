# 🛡️ Cyber Kavach

> **AI-Powered Real-Time Cloud Threat Detection & Response Platform**  
> *Detect. Predict. Respond. Explain. — Before the damage is done.*

---

## 🚨 What is Cyber Kavach?

Cyber Kavach is a **next-generation**, AI-powered, host-based intrusion detection and response platform built for cloud environments. It combines **Edge Machine Learning** for zero-day anomaly detection with a **Generative AI Copilot** for automated threat triage — running as a set of Docker containers that continuously monitor, predict, respond, and explain cyber threats in real time.

**We don't just stop attacks — we understand them.**

---

## 🎯 Problem

Cloud systems are always running — and so are attacks.

- Developers deploy applications with minimal active monitoring
- Traditional tools (Splunk, Snort) are too heavy for lightweight cloud deployments
- Most systems only **log** attacks, not **stop** them
- Static threshold rules miss **zero-day** and **behavioral** attacks
- SOC analysts are overwhelmed — manually triaging every alert is unsustainable
- By the time an alert reaches a human, damage is already done

---

## ✅ Solution

A **2-Layer AI Defense Platform** combining edge machine learning for behavioral anomaly detection with a cloud generative AI copilot for automated threat triage — all wrapped in a modular, real-time intrusion detection and response system with automated remediation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       HOST MACHINE                          │
│  /var/log/auth.log  │  /proc  │  netstat / ss  │  psutil   │
└──────────────┬──────────────────────────────────────────────┘
               │ reads (--network host)
               ▼
┌──────────────────────────────────────┐
│   Agent Container  (Python)         │
│                                     │
│  ┌── Rule-Based Detectors ───────┐  │
│  │ brute_force.py                │  │
│  │ reverse_shell.py              │  │  → Signature Detection
│  │ network_monitor.py            │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌── ML Engine (Layer 1) ────────┐  │
│  │ ml/ml_detector.py             │  │
│  │ ml/anomaly_model.pkl          │  │  → Behavioral Anomaly
│  │ Isolation Forest (sklearn)    │  │    Detection (Zero-Day)
│  └───────────────────────────────┘  │
│                                     │
│  responder.py  → Blocks / Kills     │
│  sender.py     → POST /alerts       │
└──────────────────────────────────────┘
               │ HTTP POST /alerts
               ▼
┌──────────────────────────────────┐     ┌──────────────────────────┐
│   Backend Container (FastAPI)    │─WS─▶│  Frontend Container      │
│                                  │     │  (HTML/CSS/JS)           │
│  POST  /alerts                   │     │                          │
│  GET   /alerts                   │     │  Live Alert Feed         │
│  WS    /ws                       │     │  Severity Badges         │
│  GET   /health                   │     │  Attack Timeline         │
│  GET   /alerts/{id}/ai-analysis  │     │  Agent Status            │
│                                  │     │  ✨ AI Analysis Modal    │
│  ┌── Gen-AI Engine (Layer 2) ─┐  │     └──────────────────────────┘
│  │ Gemini / OpenAI / Anthropic│  │
│  │ Auto-Triage Copilot        │  │
│  │ Executive Triage Reports   │  │
│  └────────────────────────────┘  │
│                                  │
│  email_notifier.py               │
│  alerts.json (backup)            │
└──────────────────────────────────┘
               │ SMTP
               ▼
          📧 Email Alert
```

---

## 🧠 2-Layer AI Architecture

### Layer 1 — Endpoint Machine Learning (Behavioral Anomaly Detection)

Traditional rule-based detectors catch *known* threats. Our **Isolation Forest** ML model catches *unknown* ones.

- Trains on baseline CPU, Memory, Network, and Disk I/O telemetry
- Runs directly on the agent endpoint — no cloud roundtrip needed
- Every 10 seconds, feeds live system metrics into `model.predict()`
- If the model outputs `-1` → flags a **Zero-Day Behavioral Anomaly**
- No labeled attack data needed — fully **unsupervised learning**

### Layer 2 — Cloud Generative AI (Auto-Triage Copilot)

Detecting a threat is step one. Understanding it is step two — and we automate that too.

- On every alert, the backend forwards raw alert JSON to a **Generative AI** (Gemini / OpenAI / Anthropic)
- System prompt acts as a **Senior SOC Cybersecurity Analyst**
- Generates a 3-sentence **Executive Triage Report** explaining:
  1. What happened
  2. How the attacker likely got in
  3. Why the system blocked it
- Dashboard shows a **✨ AI Analysis** modal on any alert with one click

---

## 🔍 Detection Modules

| Module | Type | Watches | Threat | Severity |
|---|---|---|---|---|
| `brute_force.py` | Rule-Based | `/var/log/auth.log` | Repeated failed SSH logins (≥5 in 60s) | MEDIUM |
| `reverse_shell.py` | Rule-Based | `ps`, `/proc`, `netstat` | `bash/nc/python` with outbound TCP on suspicious port | HIGH |
| `network_monitor.py` | Rule-Based | `ss -tnp` / `netstat` | Connections to blacklisted IPs / high frequency traffic | MEDIUM |
| `ml_detector.py` | **ML (Isolation Forest)** | CPU, Memory, Network, Disk I/O | Behavioral anomaly / zero-day threat | HIGH |

---

## ⚡ Detection Event Pipeline

```
                    ┌─── Rule-Based Detectors ───┐
Host Telemetry ────▶│                            │───▶ Responder ───▶ Backend API ───▶ Gen-AI Triage
                    │   ML Anomaly Detector      │         │              │                  │
                    └────────────────────────────┘         ▼              ▼                  ▼
                                                     Block / Kill    Email Alert     ✨ AI Analysis
                                                                    + WebSocket      on Dashboard
```

Each detection — whether rule-based or ML-driven — goes through a unified pipeline. Adding a new detector is as simple as dropping a new module in `detectors/` or `ml/`.

---

## 📦 Alert Payload (Unified Format)

Every alert, regardless of source (rule-based or ML), follows this structure:

```json
{
  "id": "uuid",
  "type": "reverse_shell | brute_force | network_anomaly | ml_anomaly",
  "severity": "HIGH",
  "ip": "192.168.1.100",
  "process": "bash",
  "action": "SIMULATED_KILL",
  "reason": "bash process with outbound TCP connection on port 4444",
  "timestamp": "2026-04-24T12:00:00Z",
  "ml_metadata": {
    "anomaly_score": -0.82,
    "features": { "cpu": 94.2, "memory": 87.1, "connections": 312 }
  },
  "ai_analysis": "Executive triage report generated by Gen-AI Copilot..."
}
```

```

> **Note:** `ml_metadata` is present only on `ml_anomaly` alerts. `ai_analysis` is populated asynchronously by the Gen-AI Copilot.

---

## 🐳 Docker Services

| Service | Language | Port | Role |
|---|---|---|---|
| `agent` | Python + Scikit-Learn | — | Rule-Based Detection + ML Anomaly Detection + Response (host network) |
| `backend` | FastAPI + Gen-AI SDK | 8000 | API + WebSocket + Gen-AI Triage + Email relay |
| `frontend` | HTML/JS | 3000 | Live dashboard + ✨ AI Analysis modal |

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- A Linux host (for real log monitoring)
- Gmail app password (for email alerts)
- **(Optional)** API key for Gen-AI Copilot (Gemini, OpenAI, Anthropic, or Groq)

### 1. Clone the repo
```bash
git clone https://github.com/your-org/Cyber-Kavach.git
cd Cyber-Kavach
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your SMTP credentials and (optional) LLM API key
```

### 3. Train the ML model (first time only)
```bash
cd agent/ml
pip install -r requirements.txt
python train_model.py
cd ../..
```

### 4. Launch
```bash
docker-compose up --build -d
```

### 5. Open dashboard
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
| 4 | Spike CPU/Memory to trigger ML anomaly | Dashboard shows HIGH `ml_anomaly` alert — **zero-day detected** |
| 5 | Click any alert → **✨ AI Analysis** | Modal shows Gen-AI triage report explaining the attack |

Simulation scripts are in `scripts/simulate/`.

---

## 📁 Folder Structure

```
Cyber-Kavach/
├── agent/
│   ├── detectors/
│   │   ├── brute_force.py         ← Rule-based: SSH brute force
│   │   ├── reverse_shell.py      ← Rule-based: Reverse shell
│   │   └── network_monitor.py    ← Rule-based: Network anomaly
│   ├── ml/                        ← 🧠 Layer 1: ML Engine
│   │   ├── train_model.py         ← Trains Isolation Forest
│   │   ├── ml_detector.py         ← Live anomaly detection
│   │   ├── anomaly_model.pkl      ← Trained model (auto-generated)
│   │   ├── scaler.pkl             ← Feature scaler (auto-generated)
│   │   └── README.md              ← ML module documentation
│   ├── responder.py
│   ├── sender.py
│   ├── main.py
│   └── Dockerfile
├── backend/
│   ├── main.py                    ← 🤖 Layer 2: Gen-AI Copilot integrated
│   ├── email_notifier.py
│   ├── alerts.json
│   └── Dockerfile
├── frontend/
│   ├── index.html                 ← ✨ AI Analysis modal
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

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Agent Detectors | Python 3.11, psutil | Rule-based signature detection |
| ML Engine | Scikit-Learn (Isolation Forest), Joblib, NumPy | Unsupervised behavioral anomaly detection |
| Backend API | FastAPI, Uvicorn, WebSockets | Alert ingestion, storage, real-time push |
| Gen-AI Copilot | Gemini / OpenAI / Anthropic API | Automated threat triage & executive reports |
| Frontend | HTML, CSS (Glassmorphism), Vanilla JS | Real-time dashboard with AI Analysis modal |
| Infrastructure | Docker, Docker Compose, Nginx | Containerized multi-service deployment |
| Notifications | SMTP (Gmail) | Automated email alerts |

---

## 🔥 USP

> Cyber Kavach doesn't just detect and log — it **predicts** anomalies with ML, **stops** attacks in real time, and **explains** every incident using Generative AI. A complete, autonomous cyber defense loop from edge to analyst — no human in the loop required.

---

## 🎯 Buzzword Checklist

| Buzzword | Where It Lives |
|---|---|
| Real-Time Telemetry | Agent collects live CPU / Memory / Network every 10s |
| Edge Machine Learning | Isolation Forest runs directly on the endpoint agent |
| Unsupervised Learning | No labeled attack data needed — learns normal behavior |
| Zero-Day Detection | ML catches unknown behavioral patterns, not just known signatures |
| Automated Remediation | Responder module blocks IPs / kills processes autonomously |
| Generative AI Copilot | LLM auto-generates triage reports for every alert |
| Behavioral Analytics | ML profiles system behavior, not static threshold rules |
| Explainable AI | Every detection comes with a human-readable reason |

---

## 🛡️ Built For

- DevSecOps teams
- Small-scale cloud deployments
- Developer-friendly runtime security
- SOC teams needing automated triage
- Hackathon demonstrations of real security + AI principles

---

## 👥 Team

Built at a Cybersecurity Hackathon · DevSecOps Track · 2026
