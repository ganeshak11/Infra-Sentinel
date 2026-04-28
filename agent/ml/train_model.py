"""
train_model.py — Trains an Isolation Forest on baseline system telemetry.

This script collects N samples of "normal" system behaviour by reading live
CPU, Memory, Network, and Disk I/O metrics via psutil.  It then fits a
Scikit-Learn Isolation Forest and exports:

    anomaly_model.pkl   — the trained model
    scaler.pkl          — the StandardScaler used for feature normalisation

The ml_detector.py module loads these artefacts at agent startup.

Usage:
    python train_model.py                   # defaults: 200 samples, 1s apart
    python train_model.py --samples 500     # collect 500 samples
    python train_model.py --interval 2      # 2 seconds between samples
    python train_model.py --contamination 0.03
"""

import os
import sys
import time
import argparse
import logging
import numpy as np
import psutil
from pathlib import Path

try:
    import joblib
except ImportError:
    from sklearn.externals import joblib  # type: ignore[attr-defined]

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("train_model")

# ── Output paths (same directory as this script) ─────────────────────────────
_ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = _ML_DIR / "anomaly_model.pkl"
SCALER_PATH = _ML_DIR / "scaler.pkl"

# Feature names — MUST match the order used in ml_detector.py
FEATURE_NAMES = [
    "cpu_percent",
    "memory_percent",
    "net_connections",
    "net_bytes_sent",
    "net_bytes_recv",
    "disk_io_read",
    "disk_io_write",
]


# ── Telemetry Collector (identical logic to ml_detector.py) ──────────────────

class TelemetryCollector:
    """
    Collects system telemetry via psutil.

    Network and Disk I/O counters are tracked as *deltas* between successive
    calls so the model sees throughput-per-interval rather than ever-growing
    cumulative counters.

    NOTE: This is the same collector used in ml_detector.py — any changes here
    must be mirrored there (or refactored into a shared module).
    """

    def __init__(self):
        net = psutil.net_io_counters()
        self._prev_bytes_sent = net.bytes_sent
        self._prev_bytes_recv = net.bytes_recv

        try:
            disk = psutil.disk_io_counters()
            self._prev_disk_read = disk.read_bytes
            self._prev_disk_write = disk.write_bytes
            self._disk_available = True
        except Exception:
            self._prev_disk_read = 0
            self._prev_disk_write = 0
            self._disk_available = False
            logger.warning("Disk I/O counters unavailable — disk features will be 0.")

    def collect(self) -> dict:
        """Return a dict of the 7 features defined in FEATURE_NAMES."""
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent

        try:
            net_conns = len(psutil.net_connections(kind="inet"))
        except (psutil.AccessDenied, OSError):
            net_conns = 0

        net = psutil.net_io_counters()
        delta_sent = max(net.bytes_sent - self._prev_bytes_sent, 0)
        delta_recv = max(net.bytes_recv - self._prev_bytes_recv, 0)
        self._prev_bytes_sent = net.bytes_sent
        self._prev_bytes_recv = net.bytes_recv

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


# ── Data Collection ──────────────────────────────────────────────────────────

def collect_baseline(num_samples: int, interval: float) -> np.ndarray:
    """
    Collect `num_samples` snapshots of system telemetry, sleeping `interval`
    seconds between each.  Returns a 2-D numpy array of shape
    (num_samples, len(FEATURE_NAMES)).
    """
    collector = TelemetryCollector()

    # Prime the CPU counter — first call always returns 0.0
    psutil.cpu_percent(interval=None)
    time.sleep(interval)

    samples = []

    logger.info("Collecting %d baseline samples (interval: %.1fs) …", num_samples, interval)
    logger.info("Estimated time: ~%.0f seconds", num_samples * interval)
    logger.info("-" * 55)

    for i in range(1, num_samples + 1):
        features = collector.collect()
        row = [features[f] for f in FEATURE_NAMES]
        samples.append(row)

        # Progress feedback every 10% or every 25 samples
        if i % max(1, num_samples // 10) == 0 or i == num_samples:
            logger.info(
                "  [%3d/%d]  CPU: %5.1f%%  MEM: %5.1f%%  Conns: %3d  "
                "NetTx: %8d B  NetRx: %8d B  DiskR: %8d B  DiskW: %8d B",
                i, num_samples, *row,
            )

        if i < num_samples:
            time.sleep(interval)

    logger.info("-" * 55)
    logger.info("Collection complete — %d samples gathered.", num_samples)

    return np.array(samples, dtype=np.float64)


# ── Training ─────────────────────────────────────────────────────────────────

def train_and_export(
    data: np.ndarray,
    contamination: float = 0.05,
    random_state: int = 42,
):
    """
    1. Fit a StandardScaler on the collected data
    2. Train an IsolationForest on the scaled data
    3. Export both artefacts as .pkl files
    4. Print summary statistics for verification
    """
    n_samples, n_features = data.shape
    logger.info("Training data shape: %d samples × %d features", n_samples, n_features)

    # ── 1. Scale ──────────────────────────────────────────────────────
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)

    logger.info("Feature statistics (raw):")
    logger.info("  %-20s %10s %10s %10s %10s", "Feature", "Mean", "Std", "Min", "Max")
    for idx, name in enumerate(FEATURE_NAMES):
        col = data[:, idx]
        logger.info(
            "  %-20s %10.2f %10.2f %10.2f %10.2f",
            name, col.mean(), col.std(), col.min(), col.max(),
        )

    # ── 2. Train Isolation Forest ─────────────────────────────────────
    logger.info("")
    logger.info("Training Isolation Forest …")
    logger.info("  contamination : %.2f", contamination)
    logger.info("  n_estimators  : 100 (default)")
    logger.info("  random_state  : %d", random_state)

    model = IsolationForest(
        contamination=contamination,
        n_estimators=100,
        max_samples="auto",
        random_state=random_state,
        n_jobs=-1,          # use all CPU cores for training
    )
    model.fit(data_scaled)

    # ── 3. Validate on training data ──────────────────────────────────
    predictions = model.predict(data_scaled)
    scores = model.decision_function(data_scaled)

    n_normal = int((predictions == 1).sum())
    n_anomaly = int((predictions == -1).sum())

    logger.info("")
    logger.info("Training validation:")
    logger.info("  Normal samples  : %d (%.1f%%)", n_normal, 100 * n_normal / n_samples)
    logger.info("  Anomaly samples : %d (%.1f%%)", n_anomaly, 100 * n_anomaly / n_samples)
    logger.info("  Score range     : [%.4f, %.4f]", scores.min(), scores.max())
    logger.info("  Score mean      : %.4f", scores.mean())

    # ── 4. Export ─────────────────────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    model_size = os.path.getsize(MODEL_PATH) / 1024
    scaler_size = os.path.getsize(SCALER_PATH) / 1024

    logger.info("")
    logger.info("=" * 55)
    logger.info("✅ Model exported  → %s (%.1f KB)", MODEL_PATH, model_size)
    logger.info("✅ Scaler exported → %s (%.1f KB)", SCALER_PATH, scaler_size)
    logger.info("=" * 55)

    return model, scaler


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(
        description="Train an Isolation Forest on baseline system telemetry.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--samples", "-n",
        type=int,
        default=200,
        help="Number of baseline telemetry samples to collect.",
    )
    parser.add_argument(
        "--interval", "-i",
        type=float,
        default=1.0,
        help="Seconds between each sample collection.",
    )
    parser.add_argument(
        "--contamination", "-c",
        type=float,
        default=0.05,
        help="Expected fraction of anomalies in the data (0.0 – 0.5).",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducibility.",
    )
    return parser.parse_args()


# ── Entry Point ───────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    logger.info("=" * 55)
    logger.info("🧠  Cyber Kavach — ML Model Trainer")
    logger.info("=" * 55)
    logger.info("  Samples        : %d", args.samples)
    logger.info("  Interval       : %.1fs", args.interval)
    logger.info("  Contamination  : %.2f", args.contamination)
    logger.info("  Random State   : %d", args.random_state)
    logger.info("  Output Dir     : %s", _ML_DIR)
    logger.info("=" * 55)
    logger.info("")

    # Phase 1 — Collect baseline telemetry
    data = collect_baseline(args.samples, args.interval)

    logger.info("")

    # Phase 2 — Train and export
    train_and_export(data, args.contamination, args.random_state)

    logger.info("")
    logger.info("Done! The agent will load these files automatically on next start.")
    logger.info("To test: ML_ENABLED=true python main.py")


if __name__ == "__main__":
    main()
