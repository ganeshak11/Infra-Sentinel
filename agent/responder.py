"""
responder.py — Takes automated action in response to detected threats.

Receives an alert dict and either:
  - DEMO_MODE=true  → logs the action without executing it (SIMULATED_BLOCK / SIMULATED_KILL)
  - DEMO_MODE=false → actually blocks the IP via iptables or kills the process via os.kill

Updates the alert["action"] field before returning so the sender can include it.
"""

import os
import signal
import subprocess
import logging

logger = logging.getLogger("responder")


def respond(alert, config):
    """
    Execute (or simulate) a response action based on the alert type.

    Mutates alert["action"] in-place with the action taken.

    Args:
        alert:  dict following the standard alert format (must have "type", "ip", "process")
        config: dict with at least "demo_mode" (bool)
    """
    demo = config["demo_mode"]
    alert_type = alert["type"]

    if alert_type in ("brute_force", "network_anomaly", "deception_alert"):
        _handle_ip_block(alert, demo)
    elif alert_type == "reverse_shell":
        _handle_process_kill(alert, demo)
        _handle_ip_block(alert, demo)
        alert["action"] = "KILLED_AND_BLOCKED"
    elif alert_type == "cryptominer":
        _handle_process_kill(alert, demo)
    elif alert_type == "ml_anomaly":
        _handle_ml_flag(alert, demo)
    else:
        logger.warning("Unknown alert type '%s' — no action taken.", alert_type)
        alert["action"] = "NONE"


# ── IP Blocking ──────────────────────────────────────────────────────

def _handle_ip_block(alert, demo):
    """
    Block the offending IP via iptables, or simulate it in demo mode.

    Args:
        alert: dict with "ip" key
        demo:  bool — if True, only log the action
    """
    ip = alert["ip"]

    if demo:
        logger.info(
            "[DEMO] Would block IP %s with iptables — skipping (demo mode).", ip
        )
        alert["action"] = "SIMULATED_BLOCK"
    else:
        try:
            subprocess.run(
                ["iptables", "-I", "INPUT", "1", "-s", ip, "-j", "DROP"],
                check=True,
                capture_output=True,
                text=True,
                timeout=10,
            )
            logger.info("✅ Blocked IP %s via iptables.", ip)
            alert["action"] = "IP_BLOCKED"
        except subprocess.CalledProcessError as exc:
            logger.error("Failed to block IP %s: %s", ip, exc.stderr)
            alert["action"] = "BLOCK_FAILED"
        except FileNotFoundError:
            logger.error("iptables not found — cannot block IP %s.", ip)
            alert["action"] = "BLOCK_FAILED"


# ── ML Anomaly Flagging ──────────────────────────────────────────────

def _handle_ml_flag(alert, demo):
    """
    Flag an ML-detected behavioral anomaly.

    ML anomalies are system-wide deviations — there is no single IP to block
    or process to kill.  The alert is flagged so the Gen-AI Copilot (Layer 2)
    can perform automated triage.

    Args:
        alert: dict with ml_metadata
        demo:  bool — if True, prefix action with SIMULATED_
    """
    if demo:
        logger.info(
            "[DEMO] ML anomaly flagged for triage — score: %s",
            alert.get("ml_metadata", {}).get("anomaly_score", "N/A"),
        )
        alert["action"] = "SIMULATED_FLAG"
    else:
        logger.warning(
            "🧠 ML anomaly flagged for triage — score: %s",
            alert.get("ml_metadata", {}).get("anomaly_score", "N/A"),
        )
        alert["action"] = "FLAGGED"


# ── Process Killing ──────────────────────────────────────────────────

def _handle_process_kill(alert, demo):
    """
    Kill the suspicious process via os.kill(SIGKILL), or simulate it.

    Extracts the PID from alert["process"] which is formatted as
    "processname (PID 12345)".

    Args:
        alert: dict with "process" key containing PID info
        demo:  bool — if True, only log the action
    """
    process_info = alert.get("process", "")
    pid = _extract_pid(process_info)

    if pid is None:
        logger.warning("Could not extract PID from '%s' — no action taken.", process_info)
        alert["action"] = "KILL_FAILED"
        return

    if demo:
        logger.info(
            "[DEMO] Would kill process PID %d — skipping (demo mode).", pid
        )
        alert["action"] = "SIMULATED_KILL"
    else:
        try:
            os.kill(pid, signal.SIGKILL)
            logger.info("✅ Killed process PID %d.", pid)
            alert["action"] = "PROCESS_KILLED"
        except ProcessLookupError:
            logger.warning("Process PID %d no longer exists.", pid)
            alert["action"] = "PROCESS_GONE"
        except PermissionError:
            logger.error("Permission denied killing PID %d — run as root.", pid)
            alert["action"] = "KILL_FAILED"


def _extract_pid(process_str):
    """
    Extract integer PID from a string like "bash (PID 12345)".
    Returns int or None if parsing fails.
    """
    try:
        # Expected format: "name (PID <number>)"
        start = process_str.index("PID ") + 4
        end = process_str.index(")", start)
        return int(process_str[start:end])
    except (ValueError, AttributeError):
        return None
