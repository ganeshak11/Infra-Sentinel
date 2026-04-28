"""
cryptominer.py — Module 5: Cryptojacking Auto-Kill

Detects and neutralizes CPU-hogging cryptominers.
Scans all processes every SCAN_INTERVAL. If a process name or command line
contains known mining heuristics AND it consumes high CPU over time,
it is instantly killed.
"""

import time
import uuid
import psutil
import logging
from collections import defaultdict
from datetime import datetime, timezone

from responder import respond
from sender import send_alert

logger = logging.getLogger("detector.cryptominer")

# ── Configuration ─────────────────────────────────────────────────────────────
SCAN_INTERVAL = 10  # Seconds between scans
CPU_THRESHOLD = 70.0  # Percentage to consider "high CPU"
CONSECUTIVE_POLLS_REQUIRED = 2  # Must be high CPU for 2 polls (20 seconds)

MINER_KEYWORDS = {
    "xmrig", "minerd", "cgminer", "cpuminer", "stratum",
    "nicehash", "monero", "ethminer", "kdevtmpfsi"
}

WHITELIST = {
    "systemd", "kthreadd", "ksoftirqd", "docker", "containerd", 
    "kubelet", "python", "python3"
}


def start_cryptominer_detector(config: dict):
    """
    Spawns in its own daemon thread. Every SCAN_INTERVAL, checks all processes
    for cryptomining signatures + high CPU consumption.
    """
    logger.info("Cryptominer killer starting (Threshold: >%d%% for %ds)", 
                CPU_THRESHOLD, SCAN_INTERVAL * CONSECUTIVE_POLLS_REQUIRED)
    
    # Map of PID -> consecutive times seen above CPU_THRESHOLD
    high_cpu_streaks = defaultdict(int)
    
    while True:
        try:
            current_pids = set()
            
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    # First call returns 0.0, subsequent calls return CPU% since last call.
                    # Since we scan every 10s, this returns the 10s average.
                    cpu = proc.cpu_percent(interval=None)
                    
                    pid = proc.info['pid']
                    name = (proc.info['name'] or "").lower()
                    cmdline = " ".join(proc.info['cmdline'] or []).lower()
                    
                    current_pids.add(pid)
                    
                    # Ignore whitelisted system processes
                    if name in WHITELIST:
                        continue
                        
                    # 1. Match heuristics
                    is_miner = any(kw in name or kw in cmdline for kw in MINER_KEYWORDS)
                    
                    # 2. Check CPU
                    if cpu > CPU_THRESHOLD and is_miner:
                        high_cpu_streaks[pid] += 1
                        
                        if high_cpu_streaks[pid] >= CONSECUTIVE_POLLS_REQUIRED:
                            alert = {
                                "id": str(uuid.uuid4()),
                                "type": "cryptominer", 
                                "severity": "CRITICAL",
                                "ip": "127.0.0.1", 
                                "process": f"{name} (PID {pid})",
                                "action": None,
                                "reason": (
                                    f"Cryptominer detected! Process '{name}' (PID {pid}) "
                                    f"using {cpu}% CPU and matched mining signatures."
                                ),
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            }
                            
                            logger.warning("🚨 CRYPTOMINER DETECTED — %s", alert["reason"])
                            
                            # Block/Kill
                            respond(alert, config)
                            
                            send_alert(alert, config)
                            
                            # Reset streak so we don't spam if kill fails
                            high_cpu_streaks[pid] = 0
                    else:
                        # Reset streak if it drops below threshold
                        high_cpu_streaks[pid] = 0
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            # Clean up dead PIDs from streak tracker
            for pid in list(high_cpu_streaks.keys()):
                if pid not in current_pids:
                    del high_cpu_streaks[pid]
                    
        except Exception as exc:
            logger.error("Cryptominer scan error: %s", exc)
            
        time.sleep(SCAN_INTERVAL)
