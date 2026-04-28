// ===== Simulated threat data for the dashboard =====

// Generate threat timeline data (24 hours)
export const generateTimelineData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    data.push({
      time: hour,
      bruteForce: Math.floor(Math.random() * 25) + (i > 6 && i < 18 ? 10 : 2),
      reverseShell: Math.floor(Math.random() * 15) + (i > 10 && i < 16 ? 8 : 1),
      otherAttacks: Math.floor(Math.random() * 10) + 3,
    });
  }
  // Create some spikes for realism
  data[10].bruteForce = 35;
  data[11].bruteForce = 42;
  data[12].reverseShell = 28;
  data[14].bruteForce = 30;
  data[16].otherAttacks = 22;
  return data;
};

export const threatTimelineData = generateTimelineData();

// Recent alerts matching the README's alert payload schema
export const recentAlerts = [
  {
    id: 'a1b2c3d4',
    type: 'brute_force',
    label: 'Brute Force Attack Detected',
    description: 'SSH brute force attempt from 203.0.113.45',
    severity: 'HIGH',
    ip: '203.0.113.45',
    process: 'sshd',
    action: 'IP_BLOCKED',
    reason: 'Multiple failed SSH login attempts detected (23 in 60s)',
    server: 'Web Server 01',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 min ago
  },
  {
    id: 'e5f6g7h8',
    type: 'reverse_shell',
    label: 'Reverse Shell Activity',
    description: 'Suspicious shell connection detected',
    severity: 'CRITICAL',
    ip: '198.51.100.23',
    process: 'bash',
    action: 'SIMULATED_KILL',
    reason: 'bash process with outbound TCP connection on port 4444',
    server: 'App Server 02',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
  },
  {
    id: 'i9j0k1l2',
    type: 'network_anomaly',
    label: 'Unusual Outbound Connection',
    description: 'Connection to suspicious IP 185.220.101.1',
    severity: 'MEDIUM',
    ip: '185.220.101.1',
    process: 'curl',
    action: 'LOGGED',
    reason: 'Outbound connection to known Tor exit node',
    server: 'Database 01',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(), // 7 min ago
  },
  {
    id: 'm3n4o5p6',
    type: 'ip_blocked',
    label: 'IP Blocked',
    description: 'Malicious IP 198.51.100.23 has been blocked',
    severity: 'LOW',
    ip: '198.51.100.23',
    process: 'iptables',
    action: 'IP_BLOCKED',
    reason: 'IP added to blocklist after reverse shell detection',
    server: 'Web Server 01',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(), // 9 min ago
  },
  {
    id: 'q7r8s9t0',
    type: 'brute_force',
    label: 'Multiple Failed Logins',
    description: '10 failed login attempts for user "admin"',
    severity: 'HIGH',
    ip: '91.189.88.142',
    process: 'sshd',
    action: 'ALERT_SENT',
    reason: 'Repeated failed SSH authentication for root/admin accounts',
    server: 'Web Server 02',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
  },
];

// Top attacking IPs
export const topAttackers = [
  { ip: '203.0.113.45', count: 23, location: 'United States', flag: '🇺🇸', lastSeen: '12:45:30 PM' },
  { ip: '198.51.100.23', count: 17, location: 'Russia', flag: '🇷🇺', lastSeen: '12:42:15 PM' },
  { ip: '185.220.101.1', count: 13, location: 'Germany', flag: '🇩🇪', lastSeen: '12:40:22 PM' },
  { ip: '45.33.32.156', count: 9, location: 'China', flag: '🇨🇳', lastSeen: '12:38:45 PM' },
  { ip: '91.189.88.142', count: 7, location: 'France', flag: '🇫🇷', lastSeen: '12:35:12 PM' },
];

// Attack map coordinates (relative to SVG viewBox)
export const attackMapPoints = [
  { id: 1, x: 270, y: 130, ip: '203.0.113.45', type: 'Brute Force Attack', severity: 'HIGH' },
  { id: 2, x: 550, y: 110, ip: '198.51.100.23', type: 'Reverse Shell', severity: 'CRITICAL' },
  { id: 3, x: 510, y: 125, ip: '185.220.101.1', type: 'Network Anomaly', severity: 'MEDIUM' },
  { id: 4, x: 700, y: 140, ip: '45.33.32.156', type: 'Brute Force Attack', severity: 'HIGH' },
  { id: 5, x: 505, y: 135, ip: '91.189.88.142', type: 'Failed Logins', severity: 'HIGH' },
];

// Dashboard stats
export const dashboardStats = {
  securityScore: 92,
  totalAlerts: 12,
  blockedAttacks: 45,
  monitoredServers: 5,
  activeThreats: 3,
  alertsDelta: 20,
  blockedDelta: 32,
};

// Severity colors
export const severityColors = {
  CRITICAL: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', dot: 'bg-pink-500' },
  HIGH: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  BLOCKED: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500' },
};

// Alert type icons mapping
export const alertTypeIcons = {
  brute_force: '🔓',
  reverse_shell: '🐚',
  network_anomaly: '🌐',
  ip_blocked: '🚫',
  failed_logins: '🔑',
};
