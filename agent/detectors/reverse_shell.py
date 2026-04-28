"""
reverse_shell.py — Module 2: Reverse Shell Detection

Every 5 seconds, scans running processes for suspicious shells
(bash, sh, nc, python, perl) and checks whether they have an
established outbound TCP connection on a non-standard port.
If so, an alert is triggered.
"""

import os
import re
import time
import uuid
import struct
import socket
import logging
from datetime import datetime, timezone

import psutil

from responder import respond
from sender import send_alert

logger = logging.getLogger("detector.reverse_shell")

# Process names that could indicate a reverse shell
SUSPICIOUS_NAMES = {"bash", "sh", "nc", "ncat", "netcat", "python", "python3", "perl"}

# Standard ports that are considered safe — connections to these are ignored
STANDARD_PORTS = {22, 80, 443}

SCAN_INTERVAL = 5  # seconds

def _get_proc_tcp_connections(proc):
    """
    Use psutil to get TCP connections owned by this specific process.
    Returns a list of (remote_ip, remote_port, state) tuples.
    """
    connections = []
    try:
        for conn in proc.connections(kind="tcp"):
            if conn.raddr:
                connections.append((conn.raddr.ip, conn.raddr.port, conn.status))
    except (psutil.AccessDenied, psutil.ZombieProcess):
        pass
    return connections


def _is_suspicious_connection(remote_ip, remote_port, state):
    """
    A connection is suspicious if:
    1. It is in ESTABLISHED state
    2. The remote port is non-standard (not 22, 80, 443)
    3. It is not a loopback connection
    4. It is not a Docker bridge (172.16-31.x.x)
    """
    if state != "ESTABLISHED":
        return False
    if remote_port in STANDARD_PORTS:
        return False
    # Loopback and unbound
    if remote_ip.startswith("127.") or remote_ip == "0.0.0.0":
        return False
    # Docker bridge networks (172.16.0.0/12 range)
    parts = remote_ip.split(".")
    if len(parts) == 4 and parts[0] == "172":
        second = int(parts[1])
        if 16 <= second <= 31:
            return False
    return True


# Cmdline fragments that identify safe IDE/editor processes — never kill these
_SAFE_CMDLINE_PATTERNS = [
    "shellIntegration",   # VS Code shell integration
    "antigravity",        # This AI agent's own processes
    "/usr/share/code",    # VS Code
    ".vscode-server",     # VS Code remote server
    "cpuUsage.sh",        # VS Code CPU monitor helper
    "server.py",          # VS Code python helper
]


def _is_safe_process(cmdline_list):
    """Return True if this process is a known-safe IDE/editor shell."""
    cmdline = " ".join(cmdline_list or [])
    return any(pat in cmdline for pat in _SAFE_CMDLINE_PATTERNS)


def start_reverse_shell_detector(config):
    """
    Entry point called by main.py in its own thread.

    Every SCAN_INTERVAL seconds, iterates over running processes.
    For each process whose name matches SUSPICIOUS_NAMES, checks
    /proc/<pid>/net/tcp for established outbound connections on
    non-standard ports. If found, fires an alert.

    Args:
        config: dict with keys
            - demo_mode (bool): simulate or execute responses
            - backend_url (str): backend API base URL
    """
    logger.info(
        "Reverse shell detector started (interval=%ds, watching=%s)",
        SCAN_INTERVAL, ", ".join(sorted(SUSPICIOUS_NAMES)),
    )

    # Track PIDs we've already alerted on to avoid duplicates
    alerted_pids = set()

    # Agent's own PID — never flag ourselves
    own_pid = os.getpid()

    while True:
        try:
            for proc in psutil.process_iter(["pid", "name", "cmdline"]):
                try:
                    pname = (proc.info["name"] or "").lower()

                    # Check if the process name is suspicious
                    if pname not in SUSPICIOUS_NAMES:
                        continue

                    pid = proc.info["pid"]

                    # Skip the agent's own process and its parent
                    if pid == own_pid or pid == os.getppid():
                        continue

                    # Skip any python process running main.py (the agent itself)
                    cmdline = proc.info.get("cmdline") or []
                    if any("main.py" in arg for arg in cmdline):
                        continue

                    # Skip known-safe IDE/editor shells
                    if _is_safe_process(cmdline):
                        continue

                    # Skip if already alerted
                    if pid in alerted_pids:
                        continue

                    # Check its TCP connections
                    connections = _get_proc_tcp_connections(proc)

                    for remote_ip, remote_port, state in connections:
                        if _is_suspicious_connection(remote_ip, remote_port, state):
                            alerted_pids.add(pid)

                            cmdline = " ".join(proc.info.get("cmdline") or [pname])

                            alert = {
                                "id": str(uuid.uuid4()),
                                "type": "reverse_shell",
                                "severity": "HIGH",
                                "ip": remote_ip,
                                "process": f"{pname} (PID {pid})",
                                "action": None,      # Will be set by responder
                                "reason": (
                                    f"Possible reverse shell: process '{pname}' "
                                    f"(PID {pid}, cmd: {cmdline}) has an established "
                                    f"TCP connection to {remote_ip}:{remote_port}"
                                ),
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            }

                            logger.warning("🚨 ALERT — %s", alert["reason"])

                            # Respond (kill process or simulate)
                            respond(alert, config)

                            # Send alert to backend
                            send_alert(alert, config)

                            # One alert per process is enough
                            break

                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    # Process disappeared or we can't access it — skip
                    continue

        except Exception as exc:
            logger.error("Reverse shell scan error: %s", exc)

        # Clean up alerted_pids for processes that no longer exist
        alive_pids = {p.pid for p in psutil.process_iter()}
        alerted_pids = alerted_pids & alive_pids

        time.sleep(SCAN_INTERVAL)
