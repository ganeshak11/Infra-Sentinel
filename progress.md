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
**Status:** ⏳ **IN PROGRESS**

- [ ] Initialize FastAPI app with `main.py`
- [ ] Implement `POST /alerts` endpoint (Store JSON, trigger Email/WS)
- [ ] Implement `GET /alerts` endpoint to retrieve history
- [ ] Implement WebSocket `ws://.../ws` for live dashboard data
- [ ] Implement `GET /health` heartbeat ping
- [ ] Build `email_notifier.py` logic (SMTP to `ALERT_EMAIL`)
- [ ] Setup persistent `alerts.json` storage
- [ ] Add CORS Middleware

---

## 📊 Frontend — Live Security Dashboard
**Owner:** Harish Patel  
**Status:** ⏳ **IN PROGRESS**

- [ ] Setup `index.html` structure (Header, 4 Stat Cards, Alert Table, Timeline)
- [ ] Write `style.css` (Dark mode `#0d1117`, glassmorphism, cyan/green accents)
- [ ] Configure `nginx.conf` to serve static assets
- [ ] Implement `app.js` Logic:
  - [ ] Connect WebSocket to pull live alerts
  - [ ] Poll existing alerts via REST on initial load
  - [ ] Implement heartbeat ping to show Agent 🟢/🔴 status
  - [ ] Update timeline UI and badge color codings (`HIGH`/`MEDIUM`/`LOW`)

---

## 🤖 Agent — Detection & Response Core
**Owner:** Keerthi  
**Status:** ⏳ **IN PROGRESS**

- [ ] Setup `main.py` entrypoint (start loops, send heartbeats)
- [ ] Implement `sender.py` to POST alerts to backend
- [ ] Implement `responder.py` logic (demo mode block/kill vs real block/kill)
- [ ] Build Detectors:
  - [ ] `detectors/brute_force.py` (Watch `/var/log/auth.log` for limit triggers)
  - [ ] `detectors/reverse_shell.py` (Scan `ps aux` and active connections)
  - [ ] `detectors/network_monitor.py` (Compare `ss -tnp` vs `blacklist.txt`)

---

## 🧠 Agent Machine Learning (Phase 8)
**Owner:** ML Specialist  
**Status:** ⏳ **IN PROGRESS**

- [ ] Write `agent/ml/train_model.py` (Train `IsolationForest` on CPU/Mem bounds and dump to `anomaly_model.pkl`)
- [ ] Build `agent/detectors/ai_monitor.py` (Load model, scan `psutil` streams, emit `-1` anomaly to `send_alert()`)
