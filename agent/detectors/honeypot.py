"""
honeypot.py — Module 4: Advanced Deception Technology

Listens on common vulnerable ports to trap network scanners.
If an attacker connects and attempts to send data, the connection is
monitored, an alert is fired, and the IP is immediately blocked.
"""

import os
import time
import socket
import threading
import logging
import uuid
from datetime import datetime, timezone

from responder import respond
from sender import send_alert

logger = logging.getLogger("detector.honeypot")

# ── Configuration ─────────────────────────────────────────────────────────────
# Set of ports to open fake listeners on.
HONEYPOT_PORTS = {
    6379,  # Redis
    2121,  # Fake FTP
    8080,  # Alternate HTTP / Admin
}

# ── Private IPs to ignore (loopback, RFC-1918, link-local) ───────────────────
def _is_private(ip: str) -> bool:
    import re
    private_re = re.compile(
        r"^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|0\.0\.0\.0)"
    )
    return bool(private_re.match(ip))


def handle_client(conn: socket.socket, addr: tuple, port: int, config: dict):
    """Handle an incoming connection to a honeypot port."""
    remote_ip, remote_port = addr
    
    try:
        # We don't care about the attacker reading, just if they transmit exploits.
        conn.settimeout(10.0)
        
        # Send a fake banner to entice them
        if port == 6379:
            conn.sendall(b"-ERR wrong number of arguments for 'get' command\r\n")
        elif port == 2121:
            conn.sendall(b"220 vsFTPd 3.0.3 - Welcome to Cyber Kavach FTP\r\n")
        else:
            conn.sendall(b"HTTP/1.1 401 Unauthorized\r\nServer: nginx/1.18.0\r\n\r\n")

        # Wait for them to send a payload
        data = conn.recv(1024)
        
        if data:
            payload_snippet = repr(data[:50])
            
            alert = {
                "id": str(uuid.uuid4()),
                "type": "deception_alert",
                "severity": "CRITICAL",
                "ip": remote_ip,
                "process": None,
                "action": None,
                "reason": (
                    f"Honeypot trap triggered on port {port}. "
                    f"Attacker payload: {payload_snippet}"
                ),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            
            logger.warning("🚨 HONEYPOT TRIPPED — %s", alert["reason"])
            
            # Auto-block the attacker immediately
            respond(alert, config)
            send_alert(alert, config)
            
    except socket.timeout:
        pass
    except Exception as exc:
        logger.debug("Honeypot handler error for %s: %s", remote_ip, exc)
    finally:
        try:
            conn.close()
        except:
            pass


def honeypot_listener(port: int, config: dict):
    """Listens on a specific port and dispatches connections."""
    try:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("0.0.0.0", port))
        server.listen(5)
        logger.info("🍯 Honeypot listening on 0.0.0.0:%d", port)
    except Exception as exc:
        logger.error("Failed to start honeypot on port %d: %s", port, exc)
        return

    while True:
        try:
            conn, addr = server.accept()
            # Spawn a short-lived thread to handle the scanner
            t = threading.Thread(
                target=handle_client,
                args=(conn, addr, port, config),
                daemon=True,
            )
            t.start()
        except Exception as exc:
            logger.error("Honeypot accept error on port %d: %s", port, exc)
            time.sleep(1)


def start_honeypot_detector(config: dict):
    """
    Entry point for honeypot module. Spawns one listener thread per port.
    """
    logger.info("Deception module starting. Deploying honeypots...")
    
    threads = []
    for port in HONEYPOT_PORTS:
        t = threading.Thread(
            target=honeypot_listener,
            args=(port, config),
            daemon=True,
            name=f"Honeypot-{port}"
        )
        t.start()
        threads.append(t)
        
    # Block main thread
    for t in threads:
        t.join()
