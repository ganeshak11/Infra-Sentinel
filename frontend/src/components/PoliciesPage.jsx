import React, { useState } from 'react';

const defaultPolicies = [
  { id: 1, name: 'SSH Brute Force Block', type: 'Brute Force', enabled: true, threshold: '10 attempts / 60s', action: 'IP_BLOCKED', severity: 'HIGH', desc: 'Block IPs after repeated failed SSH login attempts' },
  { id: 2, name: 'Reverse Shell Kill', type: 'Reverse Shell', enabled: true, threshold: 'Any detection', action: 'SIMULATED_KILL', severity: 'CRITICAL', desc: 'Terminate processes with outbound shell connections' },
  { id: 3, name: 'Tor Exit Node Alert', type: 'Network', enabled: true, threshold: 'Any connection', action: 'ALERT_SENT', severity: 'MEDIUM', desc: 'Alert on connections to known Tor exit nodes' },
  { id: 4, name: 'Port Scan Detection', type: 'Network', enabled: false, threshold: '50 ports / 10s', action: 'IP_BLOCKED', severity: 'HIGH', desc: 'Detect and block port scanning activity' },
  { id: 5, name: 'Admin Login Alert', type: 'Authentication', enabled: true, threshold: 'Any root/admin login', action: 'ALERT_SENT', severity: 'MEDIUM', desc: 'Alert on any successful admin account login' },
  { id: 6, name: 'File Integrity Check', type: 'File System', enabled: false, threshold: 'Any modification', action: 'LOGGED', severity: 'HIGH', desc: 'Monitor critical system files for changes' },
  { id: 7, name: 'Outbound Data Limit', type: 'Network', enabled: true, threshold: '500MB / hour', action: 'ALERT_SENT', severity: 'MEDIUM', desc: 'Alert on large outbound data transfers' },
  { id: 8, name: 'Unauthorized Process', type: 'Process', enabled: false, threshold: 'Non-whitelisted', action: 'LOGGED', severity: 'LOW', desc: 'Log execution of non-whitelisted processes' },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState(defaultPolicies);
  const [filterType, setFilterType] = useState('ALL');

  const types = ['ALL', ...new Set(policies.map(p => p.type))];

  const togglePolicy = (id) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const filtered = filterType === 'ALL' ? policies : policies.filter(p => p.type === filterType);
  const activeCount = policies.filter(p => p.enabled).length;

  const sevColors = { CRITICAL: 'text-pink-400 bg-pink-500/10', HIGH: 'text-red-400 bg-red-500/10', MEDIUM: 'text-amber-400 bg-amber-500/10', LOW: 'text-emerald-400 bg-emerald-500/10' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Policies</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Define and manage security rules for your infrastructure</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Total Policies</p>
          <p className="text-2xl font-bold mt-1 text-white">{policies.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Disabled</p>
          <p className="text-2xl font-bold mt-1 text-kavach-muted">{policies.length - activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Categories</p>
          <p className="text-2xl font-bold mt-1 text-cyan-400">{types.length - 1}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5 w-fit">
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === t ? 'bg-kavach-accent text-white' : 'text-kavach-muted hover:text-kavach-text'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(policy => (
          <div key={policy.id} className={`glass-card p-5 border-l-4 transition-all ${policy.enabled ? 'border-l-emerald-500' : 'border-l-gray-600 opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sevColors[policy.severity]}`}>{policy.severity}</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.06] text-kavach-muted text-[10px] font-medium">{policy.type}</span>
                </div>
                <p className="text-xs text-kavach-muted mb-2">{policy.desc}</p>
                <div className="flex items-center gap-4 text-xs text-kavach-muted">
                  <span>Threshold: <span className="text-kavach-text">{policy.threshold}</span></span>
                  <span>Action: <span className="text-kavach-text font-mono">{policy.action}</span></span>
                </div>
              </div>
              <button onClick={() => togglePolicy(policy.id)}
                className={`w-12 h-6 rounded-full relative transition-colors ${policy.enabled ? 'bg-emerald-500' : 'bg-white/[0.1]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${policy.enabled ? 'left-[26px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
