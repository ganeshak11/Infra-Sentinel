# 🚀 Cyber Kavach Progress Tracker

This document tracks the overall building progress of the Cyber Kavach project, divided by modules based on our component README files.

---

## 🐳 Infrastructure & Deployment
**Owner:** Ganesh  
**Status:** ✅ **FINISHED**

- [x] Create [docker-compose.yml](file:///home/ganeshak11/dev/Cyber-Kavach/docker-compose.yml) to orchestrate services
- [x] Create [frontend/Dockerfile](file:///home/ganeshak11/dev/Cyber-Kavach/frontend/Dockerfile)
- [x] Create [backend/Dockerfile](file:///home/ganeshak11/dev/Cyber-Kavach/backend/Dockerfile)
- [x] Create [agent/Dockerfile](file:///home/ganeshak11/dev/Cyber-Kavach/agent/Dockerfile)
- [x] Provide `.env.example` placeholder config
- [x] Establish base [INFRA.md](file:///home/ganeshak11/dev/Cyber-Kavach/INFRA.md) documentation
- [x] Build simulated demo scripts (`scripts/simulate/`)

---

## ⚙️ Backend — API, Alerts & Notifications
**Owner:** Chinmay  
**Status:** ✅ **FINISHED**

- [x] Initialize FastAPI app with `main.py`
- [x] Implement `POST /alerts` endpoint (Store JSON, trigger Email/WS)
- [x] Implement `GET /alerts` endpoint to retrieve history
- [x] Implement WebSocket `ws://.../ws` for live dashboard data
- [x] Implement `GET /health` heartbeat ping
- [x] Build `email_notifier.py` logic (SMTP to `ALERT_EMAIL`)
- [x] Setup persistent `alerts.json` storage
- [x] Add CORS Middleware

---

## 📊 Frontend — Live Security Dashboard
**Owner:** Harish Patel  
**Status:** ✅ **FINISHED**

- [x] Setup `index.html` structure (Header, 4 Stat Cards, Alert Table, Timeline)
- [x] Write `style.css` (Dark mode `#0d1117`, glassmorphism, cyan/green accents)
- [x] Configure `nginx.conf` to serve static assets
- [x] Implement `app.js` Logic:
  - [x] Connect WebSocket to pull live alerts
  - [x] Poll existing alerts via REST on initial load
  - [x] Implement heartbeat ping to show Agent 🟢/🔴 status
  - [x] Update timeline UI and badge color codings (`HIGH`/`MEDIUM`/`LOW`)

---

## 🤖 Agent — Detection & Response Core
**Owner:** Keerthi  
**Status:** ✅ **FINISHED**

- [x] Setup `main.py` entrypoint (start loops, send heartbeats)
- [x] Implement `sender.py` to POST alerts to backend
- [x] Implement `responder.py` logic (demo mode block/kill vs real block/kill)
- [x] Build Detectors:
  - [x] `detectors/brute_force.py` (Watch `/var/log/auth.log` for limit triggers)
  - [x] `detectors/reverse_shell.py` (Scan `ps aux` and active connections)
  - [x] `detectors/network_monitor.py` (Compare `ss -tnp` vs `blacklist.txt`)

---

## 🧠 Agent Machine Learning (Phase 8)
**Owner:** Keerthi  
**Status:** ✅ **FINISHED**

- [x] Write `agent/ml/train_model.py` (Train `IsolationForest` on CPU/Mem bounds and dump to `anomaly_model.pkl`)
- [x] Build `agent/detectors/ml_detector.py` (Load model, scan `psutil` streams, emit `-1` anomaly to `send_alert()`)
