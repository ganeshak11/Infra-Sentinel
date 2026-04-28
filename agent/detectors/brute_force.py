"""
brute_force.py — Module 1: SSH Brute Force Detection

Continuously tails /var/log/auth.log and counts failed SSH login
attempts per source IP within a rolling time window.
If the count reaches the configured threshold, an alert is triggered.
"""

import re
import time
import uuid
import logging
from datetime import datetime, timezone
from collections import defaultdict

from responder import respond
from sender import send_alert

logger = logging.getLogger("detector.brute_force")

# Regex to extract failed SSH login attempts and their source IPs
# Matches both attack patterns:
#   "Failed password for root from 192.168.1.100 port 22 ssh2"
#   "Invalid user haxor from 192.168.1.100 port 22"
FAILED_SSH_RE = re.compile(
    r"(?:Failed password for(?: invalid user)? \S+ from|Invalid user \S+ from)\s+(\d+\.\d+\.\d+\.\d+)"
)


def _tail_file(filepath):
    """
    Generator that yields new lines appended to a file (like `tail -f`).
    Starts reading from the end of the file so we only see new entries.
    """
    try:
        with open(filepath, "r") as f:
            # Seek to end of file
            f.seek(0, 2)
            while True:
                line = f.readline()
                if line:
                    yield line.strip()
                else:
                    # No new line yet — wait briefly before retrying
                    time.sleep(0.5)
    except FileNotFoundError:
        logger.error("Log file not found: %s — brute force detector cannot run.", filepath)
    except PermissionError:
        logger.error("Permission denied reading: %s — run as root or adjust permissions.", filepath)


def _prune_old_timestamps(timestamps, window):
    """
    Remove timestamps older than `window` seconds from the list.
    Returns the pruned list.
    """
    cutoff = time.time() - window
    return [ts for ts in timestamps if ts > cutoff]


def start_brute_force_detector(config):
    """
    Entry point called by main.py in its own thread.

    Tails /var/log/auth.log, tracks failed SSH logins per IP,
    and fires an alert when the threshold is exceeded within the
    rolling window.

    Args:
        config: dict with keys
            - brute_threshold (int): max failed attempts before alert
            - brute_window (int): rolling window in seconds
            - demo_mode (bool): simulate or execute responses
            - backend_url (str): backend API base URL
    """
    threshold = config["brute_threshold"]
    window = config["brute_window"]
    log_path = "/var/log/auth.log"

    logger.info(
        "Brute force detector started (threshold=%d, window=%ds, log=%s)",
        threshold, window, log_path,
    )

    # Dict mapping IP → list of timestamps of failed attempts
    # Example: {"192.168.1.100": [1713950000.0, 1713950005.0, ...]}
    fail_tracker = defaultdict(list)

    # Set of IPs already alerted (to avoid duplicate alerts within the same window)
    alerted_ips = set()

    for line in _tail_file(log_path):
        match = FAILED_SSH_RE.search(line)
        if not match:
            continue

        ip = match.group(1)
        now = time.time()

        # Record this failed attempt
        fail_tracker[ip].append(now)

        # Prune old timestamps outside the rolling window
        fail_tracker[ip] = _prune_old_timestamps(fail_tracker[ip], window)

        count = len(fail_tracker[ip])
        logger.debug("Failed SSH from %s — count in window: %d", ip, count)

        # Check if threshold is exceeded and we haven't already alerted
        if count >= threshold and ip not in alerted_ips:
            alerted_ips.add(ip)

            alert = {
                "id": str(uuid.uuid4()),
                "type": "brute_force",
                "severity": "MEDIUM",
                "ip": ip,
                "process": None,
                "action": None,          # Will be set by responder
                "reason": (
                    f"SSH brute force detected: {count} failed login attempts "
                    f"from {ip} within {window}s (threshold: {threshold})"
                ),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            logger.warning("🚨 ALERT — %s", alert["reason"])

            # Respond (block IP or simulate) — sets alert["action"]
            respond(alert, config)

            # Send alert to backend
            send_alert(alert, config)

        # If the IP drops below threshold after the window rolls over,
        # allow it to be alerted again in the future
        if count < threshold and ip in alerted_ips:
            alerted_ips.discard(ip)
