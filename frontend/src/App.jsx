import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCards from './components/StatCards';
import ThreatsChart from './components/ThreatsChart';
import AttackMap from './components/AttackMap';
import RecentAlerts from './components/RecentAlerts';
import TopAttackers from './components/TopAttackers';
import AlertsPage from './components/AlertsPage';
import IncidentsPage from './components/IncidentsPage';
import LiveMonitorPage from './components/LiveMonitorPage';
import SearchPage from './components/SearchPage';
import ThreatIntelPage from './components/ThreatIntelPage';
import ProtectionPage from './components/ProtectionPage';
import ServersPage from './components/ServersPage';
import SettingsPage from './components/SettingsPage';
import PoliciesPage from './components/PoliciesPage';
import UsersPage from './components/UsersPage';
import { useWebSocket } from './hooks/useWebSocket';

// Protection page configs
const protectionConfigs = {
  'Brute Force Protection': {
    filterType: 'brute_force',
    title: 'Brute Force Protection',
    description: 'Monitor and block SSH/login brute force attempts',
    features: [
      { name: 'Login Threshold Detection', desc: 'Auto-detect repeated failed logins' },
      { name: 'Auto IP Blocking', desc: 'Block IPs after threshold exceeded' },
      { name: 'SSH Monitoring', desc: 'Watch sshd for brute force patterns' },
      { name: 'Rate Limiting', desc: 'Limit authentication attempts per minute' },
    ],
  },
  'Reverse Shell Detection': {
    filterType: 'reverse_shell',
    title: 'Reverse Shell Detection',
    description: 'Detect and terminate suspicious outbound shell connections',
    features: [
      { name: 'Shell Process Monitor', desc: 'Track bash/sh with outbound connections' },
      { name: 'Port 4444 Detection', desc: 'Alert on common reverse shell ports' },
      { name: 'Auto Process Kill', desc: 'Terminate suspicious shell processes' },
      { name: 'Connection Logging', desc: 'Log all outbound TCP connections' },
    ],
  },
  'Network Monitoring': {
    filterType: 'network_anomaly',
    title: 'Network Monitoring',
    description: 'Monitor network traffic for anomalies and suspicious connections',
    features: [
      { name: 'Tor Exit Node Detection', desc: 'Detect connections to known Tor nodes' },
      { name: 'DNS Monitoring', desc: 'Track suspicious DNS queries' },
      { name: 'Outbound Alerts', desc: 'Alert on unusual outbound traffic' },
      { name: 'Traffic Analysis', desc: 'Analyze bandwidth and connection patterns' },
    ],
  },
  'Process Monitoring': {
    filterType: 'unknown',
    title: 'Process Monitoring',
    description: 'Track running processes and detect unauthorized executables',
    features: [
      { name: 'Process Whitelist', desc: 'Only allow approved processes' },
      { name: 'CPU/Memory Alerts', desc: 'Alert on resource abuse' },
      { name: 'Suspicious Detection', desc: 'Flag unknown executables' },
      { name: 'Process History', desc: 'Log all process start/stop events' },
    ],
  },
  'File Integrity': {
    filterType: 'file_integrity',
    title: 'File Integrity Monitoring',
    description: 'Monitor critical files for unauthorized modifications',
    features: [
      { name: 'Hash Monitoring', desc: 'SHA-256 checksums of critical files' },
      { name: 'Change Detection', desc: 'Real-time file modification alerts' },
      { name: 'Baseline Management', desc: 'Maintain known-good file states' },
      { name: 'Audit Logging', desc: 'Log all file access and changes' },
    ],
  },
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kavach_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      sessionStorage.removeItem('kavach_user');
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('kavach_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('kavach_user');
  };

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <DashboardApp user={user} onLogout={handleLogout} />;
}

function DashboardApp({ user, onLogout }) {
  const { alerts, isConnected, counters } = useWebSocket();
  const [activePage, setActivePage] = useState('Dashboard');
  const [timeRange, setTimeRange] = useState('24H');

  const timeRanges = ['1H', '6H', '24H', '7D', '30D'];

  // Listen for navigation events from child components
  useEffect(() => {
    const handler = (e) => setActivePage(e.detail);
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  const renderPage = () => {
    // Check if it's a protection page
    if (protectionConfigs[activePage]) {
      const cfg = protectionConfigs[activePage];
      return <ProtectionPage alerts={alerts} filterType={cfg.filterType} title={cfg.title} description={cfg.description} features={cfg.features} />;
    }

    switch (activePage) {
      case 'Dashboard':
        return (
          <>
            <Header alerts={alerts} onNavigate={setActivePage} user={user} onLogout={onLogout} />
            <div className="flex items-center justify-end mb-4 -mt-2">
              <div className="flex items-center bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
                {timeRanges.map((range) => (
                  <button key={range} onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      timeRange === range ? 'bg-kavach-accent text-white shadow-lg shadow-kavach-accent/20' : 'text-kavach-muted hover:text-kavach-text'
                    }`}>{range}</button>
                ))}
              </div>
            </div>
            <StatCards counters={counters} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ThreatsChart />
              <AttackMap />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <RecentAlerts alerts={alerts} />
              <TopAttackers />
            </div>
          </>
        );
      case 'Alerts':
        return <AlertsPage alerts={alerts} />;
      case 'Incidents':
        return <IncidentsPage alerts={alerts} />;
      case 'Live Monitor':
        return <LiveMonitorPage alerts={alerts} isConnected={isConnected} />;
      case 'Search':
        return <SearchPage alerts={alerts} />;
      case 'Threat Intelligence':
        return <ThreatIntelPage alerts={alerts} />;
      case 'Servers':
        return <ServersPage />;
      case 'Settings':
        return <SettingsPage />;
      case 'Policies':
        return <PoliciesPage />;
      case 'Users':
        return <UsersPage />;
      default:
        return <div className="glass-card p-12 text-center"><p className="text-kavach-muted">Page not found.</p></div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0e17]">
      <Sidebar isConnected={isConnected} activePage={activePage} onNavigate={setActivePage} />
      <main className="ml-[260px] flex-1 p-6 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}
