import React from 'react';
import { alertTypeIcons, severityColors } from '../data/mockData';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function SeverityBadge({ severity }) {
  const c = severityColors[severity] || severityColors.MEDIUM;
  return <span className={`severity-badge ${c.bg} ${c.text} border ${c.border}`}>{severity}</span>;
}

export default function ProtectionPage({ alerts, filterType, title, description, icon, features }) {
  const filtered = alerts.filter(a => a.type === filterType);
  const blocked = filtered.filter(a => a.action === 'IP_BLOCKED').length;
  const critical = filtered.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const uniqueIPs = new Set(filtered.map(a => a.ip)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-kavach-muted mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Total Detections</p>
          <p className="text-2xl font-bold mt-1 text-white">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Blocked</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{blocked}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">High/Critical</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{critical}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Unique Sources</p>
          <p className="text-2xl font-bold mt-1 text-cyan-400">{uniqueIPs}</p>
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Active Protection Rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm">✓</span>
              <div>
                <p className="text-sm text-kavach-text font-medium">{feat.name}</p>
                <p className="text-[11px] text-kavach-muted">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Events ({filtered.length})</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-kavach-muted text-center py-8">No {filterType.replace('_', ' ')} events detected.</p>
          ) : filtered.map((alert, idx) => (
            <div key={alert.id || idx} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
              <span className="text-base">{alertTypeIcons[alert.type] || '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{alert.label}</p>
                <p className="text-xs text-kavach-muted truncate">{alert.description}</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-mono">{alert.ip}</span>
              <span className="text-xs text-kavach-muted">{alert.action}</span>
              <span className="text-xs text-kavach-muted whitespace-nowrap">{formatTime(alert.timestamp)}</span>
              <SeverityBadge severity={alert.severity} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
