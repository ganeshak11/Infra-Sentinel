"""
ml_detector.py — Module 7: Machine Learning Behavioral Anomaly Detection

Uses a pre-trained Isolation Forest model to detect zero-day threats based
on system telemetry (CPU, Memory, Network, Disk I/O).  The model is trained
by train_model.py and loaded at startup from .pkl files.

Every SCAN_INTERVAL seconds the detector:
  1. Collects live system metrics via psutil
  2. Normalises the feature vector with the saved StandardScaler
  3. Calls model.predict() — returns  1 (normal) or -1 (anomaly)
  4. On anomaly → fires a unified alert through responder → sender

This runs as a standard detector thread inside agent/main.py.
"""

import os
import time
import uuid
import logging
import numpy as np
import psutil
from datetime import datetime, timezone
from pathlib import Path

try:
    import joblib
except ImportError:
    # Fallback — joblib is re-exported by sklearn as well
from sklearn.externals import joblib  # type: ignore[attr-defined]

from responder import respond
from sender import send_alert

logger = logging.getLogger("detector.ml_anomaly")

# ── Configuration ─────────────────────────────────────────────────────────────
SCAN_INTERVAL = int(os.getenv("ML_SCAN_INTERVAL", "10"))  # seconds
ML_ENABLED = os.getenv("ML_ENABLED", "true").lower() == "true"

# Paths — resolved relative to this file so they work from any CWD
_ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = os.getenv("ML_MODEL_PATH", str(_ML_DIR / "anomaly_model.pkl"))
SCALER_PATH = os.getenv("ML_SCALER_PATH", str(_ML_DIR / "scaler.pkl"))

# Cooldown: suppress duplicate alerts for N seconds after one fires
ALERT_COOLDOWN = int(os.getenv("ML_ALERT_COOLDOWN", "60"))

# Feature names — must match the order used during training
FEATURE_NAMES = [
    "cpu_percent",
    "memory_percent",
    "net_connections",
    "net_bytes_sent",
    "net_bytes_recv",
    "disk_io_read",
    "disk_io_write",
]


# ── Telemetry Collector ──────────────────────────────────────────────────────

class TelemetryCollector:
    """
    Collects system telemetry via psutil.

    Network and Disk I/O counters are tracked as *deltas* between successive
    calls so the model sees throughput-per-interval rather than ever-growing
    cumulative counters.
    """

    def __init__(self):
        # Seed the "previous" counters so the first delta is meaningful
        net = psutil.net_io_counters()
        self._prev_bytes_sent = net.bytes_sent
        self._prev_bytes_recv = net.bytes_recv

        try:
            disk = psutil.disk_io_counters()
            self._prev_disk_read = disk.read_bytes
            self._prev_disk_write = disk.write_bytes
            self._disk_available = True
        except Exception:
            # Some minimal containers have no block devices
            self._prev_disk_read = 0
            self._prev_disk_write = 0
            self._disk_available = False

    def collect(self) -> dict:
        """Return a dict of the 7 features defined in FEATURE_NAMES."""
        # CPU & Memory
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent

        # Network connections count
        try:
            net_conns = len(psutil.net_connections(kind="inet"))
        except (psutil.AccessDenied, OSError):
            net_conns = 0

        # Network I/O deltas
        net = psutil.net_io_counters()
        delta_sent = max(net.bytes_sent - self._prev_bytes_sent, 0)
        delta_recv = max(net.bytes_recv - self._prev_bytes_recv, 0)
        self._prev_bytes_sent = net.bytes_sent
        self._prev_bytes_recv = net.bytes_recv

        # Disk I/O deltas
        if self._disk_available:
            try:
                disk = psutil.disk_io_counters()
                delta_read = max(disk.read_bytes - self._prev_disk_read, 0)
                delta_write = max(disk.write_bytes - self._prev_disk_write, 0)
                self._prev_disk_read = disk.read_bytes
                self._prev_disk_write = disk.write_bytes
            except Exception:
                delta_read = 0
                delta_write = 0
        else:
            delta_read = 0
            delta_write = 0

        return {
            "cpu_percent": cpu,
            "memory_percent": mem,
            "net_connections": net_conns,
            "net_bytes_sent": delta_sent,
            "net_bytes_recv": delta_recv,
            "disk_io_read": delta_read,
            "disk_io_write": delta_write,
        }


# ── Model Loader ─────────────────────────────────────────────────────────────

def _load_model():
    """Load the Isolation Forest model and StandardScaler from disk."""
    if not os.path.exists(MODEL_PATH):
        logger.error("ML model not found at %s — run train_model.py first.", MODEL_PATH)
        return None, None
    if not os.path.exists(SCALER_PATH):
        logger.error("Scaler not found at %s — run train_model.py first.", SCALER_PATH)
        return None, None

    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        logger.info("✅ ML model loaded from %s", MODEL_PATH)
        logger.info("✅ Scaler loaded from %s", SCALER_PATH)
        return model, scaler
    except Exception as exc:
        logger.error("Failed to load ML model/scaler: %s", exc)
        return None, None


# ── Alert Builder ─────────────────────────────────────────────────────────────

def _build_alert(features: dict, anomaly_score: float) -> dict:
    """
    Construct a unified alert dict with the ml_metadata extension.

    Args:
        features:      dict of the 7 raw feature values
        anomaly_score: float from model.decision_function()
    """
    return {
        "id": str(uuid.uuid4()),
        "type": "ml_anomaly",
        "severity": "HIGH",
        "ip": "local",
        "process": "system",
        "action": None,   # will be set by responder
        "reason": (
            f"ML model detected behavioral anomaly — "
            f"CPU: {features['cpu_percent']:.1f}%, "
            f"Memory: {features['memory_percent']:.1f}%, "
            f"Connections: {features['net_connections']}, "
            f"Net Tx: {features['net_bytes_sent']} B, "
            f"Net Rx: {features['net_bytes_recv']} B "
            f"(anomaly score: {anomaly_score:.4f})"
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ml_metadata": {
            "anomaly_score": round(anomaly_score, 4),
            "features": {k: round(v, 2) if isinstance(v, float) else v for k, v in features.items()},
        },
    }


# ── Detector Entry Point ─────────────────────────────────────────────────────

def start_ml_detector(config: dict):
    """
    Spawns in its own daemon thread (same pattern as all other detectors).

    Args:
        config: dict with "backend_url", "demo_mode", etc.
    """
    if not ML_ENABLED:
        logger.info("ML detector is disabled (ML_ENABLED=false). Thread exiting.")
        return

    logger.info("=" * 55)
    logger.info("🧠  ML Anomaly Detector starting …")
    logger.info("  MODEL_PATH     : %s", MODEL_PATH)
    logger.info("  SCALER_PATH    : %s", SCALER_PATH)
    logger.info("  SCAN_INTERVAL  : %ds", SCAN_INTERVAL)
    logger.info("  ALERT_COOLDOWN : %ds", ALERT_COOLDOWN)
    logger.info("=" * 55)

    # Load model & scaler
    model, scaler = _load_model()
    if model is None or scaler is None:
        logger.warning("ML detector cannot start — model/scaler unavailable.")
        return

    # Initialise telemetry collector (seeds the I/O counters)
    collector = TelemetryCollector()

    # Prime the CPU counter (first psutil.cpu_percent call always returns 0.0)
    psutil.cpu_percent(interval=None)

    last_alert_time = 0.0

    # ── Main scan loop ────────────────────────────────────────────────
    while True:
        try:
            # 1. Collect features
            features = collector.collect()

            # 2. Build feature vector in the correct order
            feature_vector = np.array(
                [[features[f] for f in FEATURE_NAMES]], dtype=np.float64
            )

            # 3. Normalise
            feature_vector_scaled = scaler.transform(feature_vector)

            # 4. Predict
            prediction = model.predict(feature_vector_scaled)[0]   # 1 or -1
            anomaly_score = model.decision_function(feature_vector_scaled)[0]

            logger.debug(
                "ML scan — prediction=%d  score=%.4f  cpu=%.1f%%  mem=%.1f%%  conns=%d",
                prediction, anomaly_score,
                features["cpu_percent"],
                features["memory_percent"],
                features["net_connections"],
            )

            # 5. If anomaly and cooldown has elapsed → fire alert
            if prediction == -1:
                now = time.time()
                if now - last_alert_time >= ALERT_COOLDOWN:
                    last_alert_time = now

                    alert = _build_alert(features, anomaly_score)

                    logger.warning(
                        "🚨 ML ANOMALY DETECTED — score=%.4f | %s",
                        anomaly_score, alert["reason"],
                    )

                    # Response action (FLAGGED in demo mode)
                    respond(alert, config)

                    # Send to backend
                    send_alert(alert, config)
                else:
                    logger.debug(
                        "ML anomaly suppressed — cooldown active (%ds remaining)",
                        int(ALERT_COOLDOWN - (now - last_alert_time)),
                    )

        except Exception as exc:
            logger.error("ML detector scan error: %s", exc, exc_info=True)

        time.sleep(SCAN_INTERVAL)
