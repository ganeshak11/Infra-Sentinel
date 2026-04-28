"""
main.py — Entry point for the Cyber Kavach Agent.

Starts 3 detector threads (brute_force, reverse_shell, network_monitor)
and sends a heartbeat GET /health to the backend every 30 seconds.
All configuration is read from environment variables.
"""

import os
import time
import threading
import logging
import requests
from dotenv import load_dotenv

from detectors.brute_force import start_brute_force_detector
from detectors.reverse_shell import start_reverse_shell_detector
from detectors.network_monitor import start_network_monitor
from detectors.honeypot import start_honeypot_detector
from detectors.cryptominer import start_cryptominer_detector
from detectors.privesc import start_privesc_detector
from ml.ml_detector import start_ml_detector

# ── Load .env if present ─────────────────────────────────────────────
load_dotenv()

# ── Configuration from environment variables ─────────────────────────
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
BRUTE_THRESHOLD = int(os.getenv("BRUTE_THRESHOLD", "5"))
BRUTE_WINDOW = int(os.getenv("BRUTE_WINDOW", "60"))
HEARTBEAT_INTERVAL = 30  # seconds

# ── Logging setup ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("cyber-kavach-agent")


# ── Heartbeat ────────────────────────────────────────────────────────
def heartbeat_loop():
    """Send GET /health to the backend every HEARTBEAT_INTERVAL seconds."""
    while True:
        try:
            resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
            logger.info(
                "Heartbeat → %s/health — %s", BACKEND_URL, resp.status_code
            )
        except requests.RequestException as exc:
            logger.warning("Heartbeat failed: %s", exc)
        time.sleep(HEARTBEAT_INTERVAL)


# ── Main ─────────────────────────────────────────────────────────────
def main():
    logger.info("=" * 55)
    logger.info("🛡️  Cyber Kavach Agent starting …")
    logger.info("=" * 55)
    logger.info("  BACKEND_URL      : %s", BACKEND_URL)
    logger.info("  DEMO_MODE        : %s", DEMO_MODE)
    logger.info("  BRUTE_THRESHOLD  : %s", BRUTE_THRESHOLD)
    logger.info("  BRUTE_WINDOW     : %s s", BRUTE_WINDOW)
    logger.info("=" * 55)

    # Shared config dict passed to each detector
    config = {
        "backend_url": BACKEND_URL,
        "demo_mode": DEMO_MODE,
        "brute_threshold": BRUTE_THRESHOLD,
        "brute_window": BRUTE_WINDOW,
    }

    # Define detector threads
    detectors = [
        ("BruteForceDetector", start_brute_force_detector, config),
        ("ReverseShellDetector", start_reverse_shell_detector, config),
        ("NetworkMonitor", start_network_monitor, config),
        ("HoneypotDetector", start_honeypot_detector, config),
        ("CryptominerKiller", start_cryptominer_detector, config),
        ("PrivilegeEscalation", start_privesc_detector, config),
        ("MLAnomalyDetector", start_ml_detector, config),
    ]

    threads = []

    # Start each detector in its own daemon thread
    for name, target_fn, cfg in detectors:
        t = threading.Thread(target=target_fn, args=(cfg,), name=name, daemon=True)
        t.start()
        logger.info("Started thread: %s", name)
        threads.append(t)

    # Start heartbeat thread
    hb = threading.Thread(target=heartbeat_loop, name="Heartbeat", daemon=True)
    hb.start()
    logger.info("Started thread: Heartbeat (every %ds)", HEARTBEAT_INTERVAL)

    logger.info("All detector threads running. Press Ctrl+C to stop.")

    # Keep the main thread alive so daemon threads continue running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down Cyber Kavach Agent …")


if __name__ == "__main__":
    main()
