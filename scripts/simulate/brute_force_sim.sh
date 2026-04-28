#!/usr/bin/env bash
# =============================================================================
# brute_force_sim.sh — Simulates an SSH brute force attack against localhost
#
# Usage: ./brute_force_sim.sh [attempts] [delay_seconds]
#   attempts       — number of failed SSH attempts to send (default: 10)
#   delay_seconds  — wait between attempts in seconds (default: 1)
#
# How it works:
#   Runs failed SSH attempts against localhost using a fake user that doesn't
#   exist. Each attempt is intentionally rejected, generating a "Failed
#   password" line in /var/log/auth.log — exactly what the agent scans for.
#
# Expected result:
#   After 5 attempts (BRUTE_THRESHOLD), the agent detects the attack,
#   logs a MEDIUM alert, and sends it to the backend → dashboard + email.
# =============================================================================

set -euo pipefail

ATTEMPTS=${1:-10}
DELAY=${2:-1}
TARGET="localhost"
FAKE_USER="haxorbot_$(date +%s)"   # unique fake user to avoid auth cache

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       🔐 Brute Force Simulation — Cyber Kavach       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Target   : $TARGET"
echo "  Fake user: $FAKE_USER"
echo "  Attempts : $ATTEMPTS"
echo "  Delay    : ${DELAY}s between attempts"
echo ""
echo "  Watching /var/log/auth.log for agent detection..."
echo "  (Agent threshold: 5 failures in 60s)"
echo ""

SUCCESS=0

for i in $(seq 1 "$ATTEMPTS"); do
    echo -n "  [Attempt $i/$ATTEMPTS] Sending failed SSH login... "
    # This will fail immediately — connection refused or auth failure
    # -o BatchMode=yes     → no interactive password prompt
    # -o ConnectTimeout=2  → fail fast
    # -o StrictHostKeyChecking=no → skip known hosts
    ssh \
        -o BatchMode=yes \
        -o ConnectTimeout=2 \
        -o StrictHostKeyChecking=no \
        -o LogLevel=QUIET \
        "${FAKE_USER}@${TARGET}" true 2>/dev/null || true

    echo "✓ rejected"

    if [ "$i" -eq 5 ]; then
        echo ""
        echo "  ⚡ Threshold reached (5 attempts) — agent should detect now"
        echo ""
    fi

    sleep "$DELAY"
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Simulation complete — check dashboard for alert  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Expected: MEDIUM severity alert"
echo "  Type    : brute_force"
echo "  Action  : SIMULATED_BLOCK (in DEMO_MODE=true)"
echo ""
