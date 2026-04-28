import React, { useState, useEffect } from 'react';
import { severityColors, alertTypeIcons } from '../data/mockData';

const BACKEND_URL = '';

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SeverityBadge({ severity }) {
  const colors = severityColors[severity] || severityColors.MEDIUM;
  return <span className={`severity-badge ${colors.bg} ${colors.text} border ${colors.border}`}>{severity}</span>;
}

export default function AlertsPage({ alerts }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = filter === 'ALL' || alert.severity === filter;
    const matchesSearch = !searchQuery ||
      alert.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.ip?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-sm text-kavach-muted mt-0.5">View and manage all security alerts ({alerts.length} total)</p>
      </div>
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <input type="text" placeholder="Search alerts by name, IP, or description..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-kavach-muted focus:outline-none focus:border-kavach-accent/40 transition-colors" />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
            {severities.map((sev) => (
              <button key={sev} onClick={() => setFilter(sev)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  filter === sev ? 'bg-kavach-accent text-white shadow-lg shadow-kavach-accent/20' : 'text-kavach-muted hover:text-kavach-text'
                }`}>{sev}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Type','Alert','Source IP','Severity','Action','Server','Time'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-kavach-muted text-sm">No alerts match the current filters.</td></tr>
              ) : filteredAlerts.map((alert, idx) => (
                <tr key={alert.id || idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-lg">{alertTypeIcons[alert.type] || '⚠️'}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-white">{alert.label}</p>
                    <p className="text-xs text-kavach-muted mt-0.5 max-w-[280px] truncate">{alert.description}</p>
                  </td>
                  <td className="px-5 py-3.5"><span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-mono font-medium">{alert.ip}</span></td>
                  <td className="px-5 py-3.5"><SeverityBadge severity={alert.severity} /></td>
                  <td className="px-5 py-3.5"><span className="text-xs text-kavach-text font-medium">{alert.action}</span></td>
                  <td className="px-5 py-3.5 text-xs text-kavach-muted">{alert.server}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs text-kavach-muted whitespace-nowrap">
                      <p>{formatTime(alert.timestamp)}</p>
                      <p className="text-[10px] mt-0.5 opacity-60">{formatDate(alert.timestamp)}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
