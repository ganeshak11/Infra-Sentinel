#!/usr/bin/env bash
# =============================================================================
# network_anomaly_sim.sh — Injects a network anomaly alert directly to backend
#
# Usage: ./network_anomaly_sim.sh [backend_url]
#   backend_url — backend base URL (default: http://localhost:8000)
#
# How it works:
#   Since the network monitor detector looks for IPs in blacklist.txt,
#   this script:
#     1. POSTs a fake network_anomaly alert directly to the backend API
#     2. This simulates what the detector would emit if it saw a connection
#        to a known Tor exit node / malicious IP
#
#   Optionally also adds the IP to blacklist.txt so the REAL detector
#   fires on next scan if any real connection to that IP exists.
#
# Expected result:
#   MEDIUM severity alert appears on dashboard immediately
# =============================================================================

set -euo pipefail

BACKEND=${1:-"http://localhost:8000"}
MALICIOUS_IP="185.220.101.45"   # Known Tor exit node (safe to use in demos)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ALERT_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "sim-net-$(date +%s)")

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   🌐 Network Anomaly Simulation — Cyber Kavach       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Backend     : $BACKEND"
echo "  Malicious IP: $MALICIOUS_IP (Tor exit node)"
echo "  Alert ID    : $ALERT_ID"
echo ""

# Check curl is available
if ! command -v curl &>/dev/null; then
    echo "  ❌ 'curl' not found. Install with: apt install curl"
    exit 1
fi

echo "  [1/2] POSTing alert to backend..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BACKEND}/alerts" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"${ALERT_ID}\",
        \"type\": \"network_anomaly\",
        \"severity\": \"MEDIUM\",
        \"ip\": \"${MALICIOUS_IP}\",
        \"process\": null,
        \"action\": \"SIMULATED_BLOCK\",
        \"reason\": \"Outbound connection to known Tor exit node ${MALICIOUS_IP}:9001 (matched blacklist.txt)\",
        \"timestamp\": \"${TIMESTAMP}\"
    }")

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo "        Response: HTTP $HTTP_STATUS ✓"
else
    echo "        ❌ Backend returned HTTP $HTTP_STATUS"
    echo "           Is the backend running at $BACKEND?"
    exit 1
fi

echo ""
echo "  [2/2] Also adding IP to blacklist.txt for real detector..."
BLACKLIST_PATH="$(dirname "$(dirname "$0")")/../agent/blacklist.txt"
if [ -f "$BLACKLIST_PATH" ]; then
    if ! grep -q "$MALICIOUS_IP" "$BLACKLIST_PATH"; then
        echo "$MALICIOUS_IP  # Tor exit node — added by simulation script" >> "$BLACKLIST_PATH"
        echo "        Added $MALICIOUS_IP to blacklist.txt ✓"
    else
        echo "        $MALICIOUS_IP already in blacklist.txt ✓"
    fi
else
    echo "        ⚠️  blacklist.txt not found at $BLACKLIST_PATH — skipping"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Simulation complete — check dashboard for alert  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Expected: MEDIUM severity alert"
echo "  Type    : network_anomaly"
echo "  Action  : SIMULATED_BLOCK"
echo ""
