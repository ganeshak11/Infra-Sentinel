"""
train_model.py — Trains an Isolation Forest on baseline system telemetry.

Collects LIVE_SAMPLES real psutil samples at 0.1s interval, then augments
to TARGET_SAMPLES (10 000) with controlled Gaussian noise so the model sees
a rich, stable normal distribution without hours of collection time.

Exports:
    anomaly_model.pkl   — trained IsolationForest
    scaler.pkl          — StandardScaler fitted on augmented data

Usage:
    python train_model.py                        # 2000 live → 10000 total
    python train_model.py --live 1000            # fewer live samples
    python train_model.py --target 5000          # smaller total dataset
    python train_model.py --contamination 0.01
"""

import os
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

# Relative noise fraction per feature — noise = value * fraction
# Keeps augmented samples proportional to actual observed values.
# A zero-byte delta stays near zero; a 10 MB delta gets ±1% = ±100 KB.
_NOISE_FRACTION = 0.01   # 1% relative noise across all features
_NOISE_FLOOR = {         # absolute minimum noise so zero-valued features still vary slightly
    "cpu_percent":     0.05,
    "memory_percent":  0.02,
    "net_connections": 0.05,
    "net_bytes_sent":  1.0,
    "net_bytes_recv":  1.0,
    "disk_io_read":    1.0,
    "disk_io_write":   1.0,
}


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

def collect_live(num_samples: int, interval: float) -> np.ndarray:
    """
    Collect `num_samples` real psutil snapshots at `interval` seconds apart.
    Returns shape (num_samples, 7).
    """
    collector = TelemetryCollector()
    psutil.cpu_percent(interval=None)   # prime — first call always 0.0
    time.sleep(interval)

    samples = []
    logger.info("Phase 1 — Live collection: %d samples @ %.2fs interval", num_samples, interval)
    logger.info("Estimated time: ~%.0f seconds — keep system IDLE", num_samples * interval)
    logger.info("-" * 55)

    for i in range(1, num_samples + 1):
        features = collector.collect()
        row = [features[f] for f in FEATURE_NAMES]
        samples.append(row)

        if i % max(1, num_samples // 10) == 0 or i == num_samples:
            logger.info(
                "  [%4d/%d]  CPU:%5.1f%%  MEM:%5.1f%%  Conns:%3d  "
                "NetTx:%8.0f B  NetRx:%8.0f B  DiskR:%8.0f B  DiskW:%8.0f B",
                i, num_samples, *row,
            )

        if i < num_samples:
            time.sleep(interval)

    logger.info("-" * 55)
    logger.info("Live collection done — %d real samples.", num_samples)
    return np.array(samples, dtype=np.float64)


def augment_to_target(live_data: np.ndarray, target: int, rng: np.random.Generator) -> np.ndarray:
    """
    Augment `live_data` up to `target` rows by sampling rows with replacement
    and adding per-feature Gaussian noise scaled to _NOISE_SCALE.

    Result is clipped so no feature goes below 0 (no negative bytes/CPU).
    """
    n_live = len(live_data)
    n_needed = target - n_live
    if n_needed <= 0:
        return live_data

    logger.info("Phase 2 — Augmenting %d real samples → %d total …", n_live, target)

    # Sample base rows with replacement
    idx = rng.integers(0, n_live, size=n_needed)
    base = live_data[idx].copy()

    # Relative noise: scale = max(value * 1%, floor)
    # This ensures a 0-byte delta doesn't get ±50B absolute noise
    floors = np.array([_NOISE_FLOOR[f] for f in FEATURE_NAMES], dtype=np.float64)
    noise_scales = np.maximum(base * _NOISE_FRACTION, floors)   # shape (n_needed, 7)
    noise = rng.normal(loc=0.0, scale=noise_scales)
    augmented = np.clip(base + noise, a_min=0.0, a_max=None)

    combined = np.vstack([live_data, augmented])
    rng.shuffle(combined)   # mix live and synthetic rows

    logger.info("Augmentation done — %d total samples (live: %d, synthetic: %d).",
                len(combined), n_live, n_needed)
    return combined


# ── Training ─────────────────────────────────────────────────────────────────

def train_and_export(
    data: np.ndarray,
    contamination: float = 0.01,
    random_state: int = 42,
):
    """
    1. Fit StandardScaler on the full dataset
    2. Train IsolationForest (200 estimators for 10k points)
    3. Validate and log statistics
    4. Export anomaly_model.pkl + scaler.pkl
    """
    n_samples, n_features = data.shape
    logger.info("Phase 3 — Training on %d samples × %d features", n_samples, n_features)

    # ── 1. Scale ──────────────────────────────────────────────────────
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)

    logger.info("Feature statistics (raw):")
    logger.info("  %-20s %10s %10s %10s %10s", "Feature", "Mean", "Std", "Min", "Max")
    for i, name in enumerate(FEATURE_NAMES):
        col = data[:, i]
        logger.info("  %-20s %10.2f %10.2f %10.2f %10.2f",
                    name, col.mean(), col.std(), col.min(), col.max())

    # ── 2. Train ──────────────────────────────────────────────────────
    logger.info("")
    logger.info("Training Isolation Forest …")
    logger.info("  contamination : %.3f", contamination)
    logger.info("  n_estimators  : 200  (increased for 10k dataset)")
    logger.info("  max_samples   : 512  (sub-sampling per tree for speed)")
    logger.info("  random_state  : %d", random_state)

    model = IsolationForest(
        contamination=contamination,
        n_estimators=200,
        max_samples=512,        # each tree sees 512 random rows — fast + diverse
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(data_scaled)

    # ── 3. Validate ───────────────────────────────────────────────────
    predictions = model.predict(data_scaled)
    scores = model.decision_function(data_scaled)
    n_normal  = int((predictions ==  1).sum())
    n_anomaly = int((predictions == -1).sum())

    logger.info("")
    logger.info("Training validation:")
    logger.info("  Normal samples  : %d (%.2f%%)", n_normal,  100 * n_normal  / n_samples)
    logger.info("  Anomaly samples : %d (%.2f%%)", n_anomaly, 100 * n_anomaly / n_samples)
    logger.info("  Score range     : [%.4f, %.4f]", scores.min(), scores.max())
    logger.info("  Score mean      : %.4f", scores.mean())
    logger.info("  Score p5 / p95  : %.4f / %.4f",
                np.percentile(scores, 5), np.percentile(scores, 95))

    # ── 4. Export ─────────────────────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    logger.info("")
    logger.info("=" * 55)
    logger.info("✅ Model  → %s (%.1f KB)", MODEL_PATH,  os.path.getsize(MODEL_PATH)  / 1024)
    logger.info("✅ Scaler → %s (%.1f KB)", SCALER_PATH, os.path.getsize(SCALER_PATH) / 1024)
    logger.info("=" * 55)
    return model, scaler


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(
        description="Train Isolation Forest on 10k baseline samples (live + augmented).",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--live", "-n",
        type=int,
        default=2000,
        help="Number of REAL live psutil samples to collect (rest is augmented).",
    )
    parser.add_argument(
        "--target", "-t",
        type=int,
        default=10000,
        help="Total training dataset size after augmentation.",
    )
    parser.add_argument(
        "--interval", "-i",
        type=float,
        default=0.1,
        help="Seconds between each live sample (0.1 = ~3.5 min for 2000 samples).",
    )
    parser.add_argument(
        "--contamination", "-c",
        type=float,
        default=0.01,
        help="Expected fraction of anomalies (0.01 = very strict normal boundary).",
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

    rng = np.random.default_rng(args.random_state)

    logger.info("=" * 55)
    logger.info("🧠  Cyber Kavach — ML Model Trainer (10k pipeline)")
    logger.info("=" * 55)
    logger.info("  Live samples   : %d @ %.2fs interval (~%.0fs)",
                args.live, args.interval, args.live * args.interval)
    logger.info("  Target total   : %d (augmented)", args.target)
    logger.info("  Contamination  : %.3f", args.contamination)
    logger.info("  Random state   : %d", args.random_state)
    logger.info("  Output dir     : %s", _ML_DIR)
    logger.info("=" * 55)
    logger.info("⚠️  Keep the system IDLE during live collection for best results.")
    logger.info("")

    # Phase 1 — collect real samples
    live_data = collect_live(args.live, args.interval)

    # Phase 2 — augment to target size
    logger.info("")
    full_data = augment_to_target(live_data, args.target, rng)

    # Phase 3 — train and export
    logger.info("")
    train_and_export(full_data, args.contamination, args.random_state)

    logger.info("")
    logger.info("✅ Done! Retrain complete. Restart the agent to load the new model.")
    logger.info("   Run: ML_ENABLED=true python main.py")


if __name__ == "__main__":
    main()
