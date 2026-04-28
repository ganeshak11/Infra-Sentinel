# 🧠 ML — Next-Gen AI Threat Detection Engine

**Owner:** Keerthi  
**Stack:** Python 3.11 + Scikit-Learn + Joblib  
**Integration:** Loaded directly into the Agent runtime

---

## What This Folder Does

The ML module is the **intelligence upgrade** for Cyber Kavach. It replaces static threshold rules (e.g., "alert if CPU > 70%") with a trained **Isolation Forest** machine learning model that learns what *normal* system behavior looks like — and flags anything that deviates as a **Zero-Day Threat**.

> This is **Layer 1** of our 2-Layer AI Architecture. Layer 2 (Generative AI Copilot) lives in the backend.

---

## 2-Layer AI Architecture — Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 1: ENDPOINT ML                       │
│              (Behavioral Anomaly Detection)                 │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │  train_model.py │───▶│  anomaly_model.pkl (trained) │    │
│  └─────────────────┘    └──────────────┬───────────────┘    │
│                                        │ loaded at startup  │
│                                        ▼                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ml_detector.py (runs inside Agent every 10s)        │   │
│  │  → Collects CPU, Memory, Net metrics via psutil      │   │
│  │  → Feeds into model.predict()                        │   │
│  │  → If prediction == -1 → flags ZERO-DAY ANOMALY      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Alert JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 2: CLOUD GEN-AI                      │
│               (Auto-Triage Copilot)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  backend/main.py → POST /alerts                      │   │
│  │  → Forwards raw alert JSON to Gemini/OpenAI API      │   │
│  │  → Prompt: "You are a Senior Cybersecurity Analyst"  │   │
│  │  → Returns 3-sentence Executive Triage Report        │   │
│  └──────────────────────────────────────────────────────┘   │
│                               │                             │
│                               ▼                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend Dashboard                                  │   │
│  │  → Click any alert → "✨ AI Analysis" modal          │   │
│  │  → Shows how the attacker got in & why it was blocked│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
agent/ml/
├── train_model.py       ← Trains the Isolation Forest on baseline telemetry
├── ml_detector.py       ← Live anomaly detection module (loaded by agent)
├── anomaly_model.pkl    ← Exported trained model (auto-generated)
├── scaler.pkl           ← Feature scaler for normalization (auto-generated)
├── requirements.txt     ← ML-specific dependencies
└── README.md            ← You are here
```

---

## What to Build

### Phase 8: Endpoint Machine Learning (Layer 1)

#### `train_model.py` — Model Training Script

A standalone script that collects baseline system telemetry and trains the model.

**Features collected (via `psutil`):**

| Feature | Source | Description |
|---|---|---|
| `cpu_percent` | `psutil.cpu_percent()` | CPU usage % (per-second) |
| `memory_percent` | `psutil.virtual_memory().percent` | RAM usage % |
| `net_connections` | `len(psutil.net_connections())` | Active TCP/UDP connections |
| `net_bytes_sent` | `psutil.net_io_counters().bytes_sent` | Bytes sent (delta) |
| `net_bytes_recv` | `psutil.net_io_counters().bytes_recv` | Bytes received (delta) |
| `disk_io_read` | `psutil.disk_io_counters().read_bytes` | Disk read bytes (delta) |
| `disk_io_write` | `psutil.disk_io_counters().write_bytes` | Disk write bytes (delta) |

**Training flow:**

```python
# 1. Collect N samples of normal system behavior (e.g., 200 samples, 1s apart)
# 2. Normalize features with StandardScaler
# 3. Train IsolationForest(contamination=0.05, random_state=42)
# 4. Export model → anomaly_model.pkl
# 5. Export scaler → scaler.pkl
```

**Usage:**
```bash
python train_model.py
# Output: anomaly_model.pkl, scaler.pkl
```

---

#### `ml_detector.py` — Live Anomaly Detection Module

A detector module that plugs into `agent/main.py` alongside the existing detectors.

**How it works:**

1. On startup → Load `anomaly_model.pkl` and `scaler.pkl`
2. Every **10 seconds** → Collect live system telemetry (same features as training)
3. Normalize the feature vector using the loaded scaler
4. Call `model.predict(features)` on the Isolation Forest
5. If prediction == `-1` → **Anomaly detected** → Generate alert

**Alert format (matches existing unified format):**

```json
{
  "id": "uuid4",
  "type": "ml_anomaly",
  "severity": "HIGH",
  "ip": "local",
  "process": "system",
  "action": "FLAGGED",
  "reason": "ML model detected behavioral anomaly — CPU: 94%, Memory: 87%, Connections: 312 (deviation from baseline)",
  "timestamp": "ISO 8601",
  "ml_metadata": {
    "anomaly_score": -0.82,
    "features": {
      "cpu_percent": 94.2,
      "memory_percent": 87.1,
      "net_connections": 312,
      "net_bytes_sent": 1048576,
      "net_bytes_recv": 5242880
    }
  }
}
```

> **Note:** The `ml_metadata` field is an extension — it gives Layer 2 (Gen-AI) richer context for triage.

---

### Phase 9: Generative AI Copilot (Layer 2)

> Layer 2 lives in **`backend/main.py`** and **`frontend/`**, not in this folder.  
> Documented here for architectural completeness.
 
#### Backend — `POST /alerts` Enhancement

When the backend receives any alert (including `ml_anomaly`):

1. Forward the raw alert JSON to the configured LLM API (Gemini / OpenAI / Anthropic / Groq)
2. System prompt: *"You are a Senior Cybersecurity Analyst at a SOC. Analyze this alert and provide a 3-sentence Executive Triage Report explaining: (1) what happened, (2) how the attacker likely got in, and (3) why the system blocked it."*
3. Store the AI response in `alert["ai_analysis"]`
4. Push the enriched alert to the dashboard via WebSocket

#### Frontend — `✨ AI Analysis` Modal

- Click any alert row in the live feed → Opens a glassmorphism modal
- Shows the AI-generated triage report with a ✨ sparkle icon
- Styled to match the existing dark-mode premium aesthetic

---

## Algorithm: Isolation Forest

**Why Isolation Forest?**

| Property | Benefit |
|---|---|
| Unsupervised | No labeled attack data needed — learns "normal" on its own |
| Lightweight | Fast training, fast inference — runs on edge devices |
| Anomaly-native | Designed specifically for anomaly detection, not repurposed |
| Low memory | Trained model is typically < 1 MB |

**How it works (simplified):**

```
Normal data points → buried deep in the tree → many splits to isolate
Anomalies → isolated quickly with few splits → short path length
Short path = outlier = potential threat
```

- `predict()` returns `1` for normal, `-1` for anomaly
- `contamination=0.05` means we expect ~5% of data to be anomalous

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ML_MODEL_PATH` | `ml/anomaly_model.pkl` | Path to the trained model file |
| `ML_SCALER_PATH` | `ml/scaler.pkl` | Path to the feature scaler file |
| `ML_SCAN_INTERVAL` | `10` | Seconds between each ML scan |
| `ML_ENABLED` | `true` | Enable/disable ML detection |
| `LLM_PROVIDER` | `gemini` | LLM API to use (`gemini`, `openai`, `anthropic`, `groq`) |
| `LLM_API_KEY` | — | API key for the chosen LLM provider |

---

## Key Libraries

```txt
scikit-learn>=1.3.0
joblib>=1.3.0
psutil>=5.9.0
numpy>=1.24.0
```

---

## Running Locally (without Docker)

### Train the model
```bash
cd agent/ml
pip install -r requirements.txt
python train_model.py
# → Generates anomaly_model.pkl and scaler.pkl
```

### Test the detector standalone
```bash
cd agent
ML_ENABLED=true python -c "from ml.ml_detector import MLDetector; d = MLDetector(); d.run_once()"
```

### Run with the full agent
```bash
cd agent
pip install -r requirements.txt
BACKEND_URL=http://localhost:8000 DEMO_MODE=true ML_ENABLED=true python main.py
```

---

## Integration with Agent

The ML detector is registered in `agent/main.py` alongside existing detectors:

```python
from ml.ml_detector import MLDetector

# Existing detectors
threads = [
    threading.Thread(target=brute_force.run, daemon=True),
    threading.Thread(target=reverse_shell.run, daemon=True),
    threading.Thread(target=network_monitor.run, daemon=True),
    threading.Thread(target=MLDetector().run, daemon=True),  # ← NEW
]
```

---

## Buzzword Checklist 🎯

| Buzzword | Where |
|---|---|
| Real-Time Telemetry | Agent collects live CPU/Memory/Network every 10s |
| Edge Machine Learning | Isolation Forest runs directly on the endpoint |
| Automated Remediation | Responder module blocks/kills based on ML flags |
| Generative AI Copilot | Gemini/OpenAI auto-generates triage reports |
| Zero-Day Detection | ML catches unknown patterns, not just known signatures |
| Unsupervised Learning | No labeled data needed — learns normal behavior |
| Behavioral Analytics | Model profiles system behavior, not static rules |

---

## Implementation Phases

- **Phase 8:** Train Isolation Forest + integrate `ml_detector.py` into Agent
- **Phase 9:** Wire up LLM API in Backend + build `✨ AI Analysis` modal in Frontend

---

> **"We don't just detect threats — we understand them."**
