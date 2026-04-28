"""
privesc.py — Module 6: Privilege Escalation Detector

Monitors for indicators of unauthorized privilege escalation:
  1. Failed 'su' attempts
  2. Failed 'sudo' attempts
  3. Unexpected modifications to /etc/passwd or /etc/shadow
"""

import os
import re
import time
import uuid
import logging
import threading
from datetime import datetime, timezone

from sender import send_alert

logger = logging.getLogger("detector.privesc")

FAILED_SU_RE = re.compile(r"su(?:\[\d+\])?: FAILED su for (\S+) by (\S+)")
FAILED_SUDO_RE = re.compile(r"sudo(?:\[\d+\])?:.*authentication failure.*user=(\S+)")


def _tail_file(filepath):
    """Generator that yields new lines appended to a file."""
    try:
        with open(filepath, "r") as f:
            f.seek(0, 2)
            while True:
                line = f.readline()
                if line:
                    yield line.strip()
                else:
                    time.sleep(0.5)
    except FileNotFoundError:
        logger.error("Log file not found: %s — privesc detector cannot run.", filepath)
    except PermissionError:
        logger.error("Permission denied reading: %s.", filepath)


def _monitor_auth_logs(config):
    """Tails auth.log for sudo/su failures."""
    log_path = "/var/log/auth.log"
    logger.info("PrivEsc monitor watching %s for failed su/sudo", log_path)

    for line in _tail_file(log_path):
        alert_reason = None
        user = "unknown"

        match_su = FAILED_SU_RE.search(line)
        match_sudo = FAILED_SUDO_RE.search(line)

        if match_su:
            target, actor = match_su.groups()
            user = actor
            alert_reason = f"Failed 'su' attempt. User '{actor}' tried to become '{target}'."
        elif match_sudo:
            user = match_sudo.group(1)
            alert_reason = f"Failed 'sudo' password authentication by user '{user}'."

        if alert_reason:
            alert = {
                "id": str(uuid.uuid4()),
                "type": "privilege_escalation",
                "severity": "HIGH",
                "ip": "127.0.0.1",
                "process": f"user: {user}",
                "action": None,
                "reason": alert_reason,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            logger.warning("🚨 PRIVESC ALERT — %s", alert["reason"])
            send_alert(alert, config)


def _monitor_passwd_files(config):
    """Polls /etc/passwd and /etc/shadow for unauthorized changes."""
    files_to_watch = ["/etc/passwd", "/etc/shadow"]
    
    # Store initial mtime
    last_mtimes = {}
    for path in files_to_watch:
        try:
            last_mtimes[path] = os.stat(path).st_mtime
        except OSError:
            logger.warning("Could not stat %s initially.", path)

    logger.info("PrivEsc monitor watching %s for modifications", ", ".join(files_to_watch))

    while True:
        for path in files_to_watch:
            try:
                current_mtime = os.stat(path).st_mtime
                if path in last_mtimes and current_mtime > last_mtimes[path]:
                    last_mtimes[path] = current_mtime
                    
                    alert = {
                        "id": str(uuid.uuid4()),
                        "type": "privilege_escalation",
                        "severity": "CRITICAL",
                        "ip": "127.0.0.1",
                        "process": "unknown",
                        "action": None,
                        "reason": f"Critical system file modified: {path} (Possible unauthorized account creation or password change)",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    logger.warning("🚨 IDENTITY TAMPERING ALERT — %s", alert["reason"])
                    send_alert(alert, config)
            except OSError:
                pass
                
        time.sleep(2)


def start_privesc_detector(config: dict):
    """Entry point."""
    t1 = threading.Thread(target=_monitor_auth_logs, args=(config,), daemon=True, name="PrivEsc-Auth")
    t2 = threading.Thread(target=_monitor_passwd_files, args=(config,), daemon=True, name="PrivEsc-File")
    t1.start()
    t2.start()
    
    # Block main thread loop
    t1.join()
