# 📊 Frontend — Live Security Dashboard

**Owner:** Harish Patel
**Stack:** HTML + CSS + Vanilla JavaScript (no frameworks)  
**Port:** `3000` (served via nginx)

---

## What This Folder Does

The frontend is the **command center** — a dark-mode, real-time security dashboard that shows alerts as they happen, severity badges, attack timeline, and agent status.

---

## Folder Structure

```
frontend/
├── index.html       ← Main dashboard page
├── style.css        ← All styling (dark mode, glassmorphism)
├── app.js           ← WebSocket connection + DOM updates
├── nginx.conf       ← Nginx config to serve static files
└── Dockerfile
```

---

## What to Build

### Visual Design Requirements

- **Dark background** — `#0d1117` or similar deep black
- **Accent color** — Cyan `#00d4ff` or green `#00ff88`
- **Font** — `Inter` or `JetBrains Mono` from Google Fonts
- **Card style** — Glassmorphism: `backdrop-filter: blur(10px)` with a subtle border
- **Feel** — Premium security product, NOT a school project

---

### `index.html` — Layout Sections

#### 1. Header
- Logo + "Cyber Kavach" title
- Agent status pill: 🟢 Agent Online / 🔴 Agent Offline
- Current date/time (live)

#### 2. Summary Counters (4 cards)
- Total Threats Detected
- Brute Force Attacks
- Reverse Shells Detected
- IPs Blocked

#### 3. Live Alert Feed (table)
| Columns | Example |
|---|---|
| Time | `12:04:33` |
| Type | `reverse_shell` |
| Severity | 🔴 HIGH badge |
| Source IP | `192.168.1.100` |
| Process | `bash` |
| Action | `SIMULATED_KILL` |
| Reason | `bash with outbound TCP on port 4444` |

- New alerts appear at the **top** with a flash animation
- Color-coded rows: HIGH → red tint, MEDIUM → orange tint, LOW → yellow tint

#### 4. Attack Timeline
- Simple vertical log at the bottom
- Format: `[12:04:33] reverse_shell detected from 192.168.1.100 — SIMULATED_KILL`
- Max 50 entries, auto-scroll to bottom

---

### `app.js` — Logic

#### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  addAlertToTable(alert);
  addToTimeline(alert);
  updateCounters(alert);
};

ws.onclose = () => updateAgentStatus(false);
ws.onopen = () => updateAgentStatus(true);
```

#### Poll for existing alerts on load
```javascript
fetch('http://localhost:8000/alerts')
  .then(r => r.json())
  .then(alerts => alerts.forEach(addAlertToTable));
```

#### Agent status via heartbeat
```javascript
setInterval(() => {
  fetch('http://localhost:8000/health')
    .then(() => updateAgentStatus(true))
    .catch(() => updateAgentStatus(false));
}, 35000);
```

#### Severity badge colors
```javascript
const colors = {
  HIGH: '#ff4444',
  MEDIUM: '#ff8c00',
  LOW: '#ffd700'
};
```

---

### `style.css` — Key Styles to Implement

```css
/* Use this color palette */
--bg: #0d1117;
--surface: rgba(255,255,255,0.05);
--border: rgba(255,255,255,0.1);
--accent: #00d4ff;
--text: #e6edf3;
--text-muted: #7d8590;
```

- Alert cards: glassmorphism with blur + border
- Row flash animation: `.new-alert { animation: flashIn 0.5s ease; }`
- Severity badges: pill-shaped with color background
- Smooth scrolling timeline

---

## Environment

The frontend connects to `http://localhost:8000` by default.  
If containers are communicating internally, this may need to be adjusted.

Set the backend URL in `app.js` at the top:
```javascript
const BACKEND_URL = 'http://localhost:8000';
```

---

## Running Locally (without Docker)

Just open `index.html` in a browser — no build step needed.

Or serve with Python:
```bash
python3 -m http.server 3000
```
