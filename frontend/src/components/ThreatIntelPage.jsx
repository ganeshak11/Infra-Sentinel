import React, { useState, useEffect } from 'react';
import { severityColors, alertTypeIcons } from '../data/mockData';

const BACKEND_URL = '';

function SeverityBadge({ severity }) {
  const c = severityColors[severity] || severityColors.MEDIUM;
  return <span className={`severity-badge ${c.bg} ${c.text} border ${c.border}`}>{severity}</span>;
}

export default function ThreatIntelPage({ alerts }) {
  const [topAttackers, setTopAttackers] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/attackers`)
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setTopAttackers(data); })
      .catch(() => {});
  }, []);

  const typeBreakdown = {};
  const sevBreakdown = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const actionBreakdown = {};

  alerts.forEach(a => {
    typeBreakdown[a.type] = (typeBreakdown[a.type] || 0) + 1;
    if (a.severity) sevBreakdown[a.severity] = (sevBreakdown[a.severity] || 0) + 1;
    if (a.action) actionBreakdown[a.action] = (actionBreakdown[a.action] || 0) + 1;
  });

  const maxType = Math.max(...Object.values(typeBreakdown), 1);
  const typeColors = { brute_force: 'bg-red-500', reverse_shell: 'bg-cyan-500', network_anomaly: 'bg-amber-500', ip_blocked: 'bg-blue-500', failed_logins: 'bg-purple-500' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Threat Intelligence</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Analysis of threat patterns and indicators</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(sevBreakdown).map(([sev, count]) => {
          const colors = { CRITICAL: 'text-pink-400', HIGH: 'text-red-400', MEDIUM: 'text-amber-400', LOW: 'text-emerald-400' };
          return (
            <div key={sev} className="glass-card p-4">
              <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">{sev}</p>
              <p className={`text-2xl font-bold mt-1 ${colors[sev]}`}>{count}</p>
              <p className="text-[10px] text-kavach-muted mt-1">{alerts.length > 0 ? Math.round((count / alerts.length) * 100) : 0}% of total</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Attack Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-kavach-text">{alertTypeIcons[type] || '⚠️'} {type.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${typeColors[type] || 'bg-gray-500'} transition-all duration-700`}
                    style={{ width: `${(count / maxType) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(typeBreakdown).length === 0 && (
              <p className="text-sm text-kavach-muted text-center py-6">No threat data available</p>
            )}
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Response Actions Taken</h3>
          <div className="space-y-3">
            {Object.entries(actionBreakdown).sort((a, b) => b[1] - a[1]).map(([action, count]) => {
              const actionColors = { IP_BLOCKED: 'text-red-400 bg-red-500/10', SIMULATED_KILL: 'text-pink-400 bg-pink-500/10', LOGGED: 'text-amber-400 bg-amber-500/10', ALERT_SENT: 'text-cyan-400 bg-cyan-500/10' };
              const c = actionColors[action] || 'text-gray-400 bg-gray-500/10';
              return (
                <div key={action} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium ${c}`}>{action}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
              );
            })}
            {Object.keys(actionBreakdown).length === 0 && (
              <p className="text-sm text-kavach-muted text-center py-6">No actions recorded</p>
            )}
          </div>
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Top Threat Actors</h3>
        {topAttackers.length === 0 ? (
          <p className="text-sm text-kavach-muted text-center py-6">No attacker data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['IP','Attacks','Location','Threat Level','Last Seen'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider pb-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topAttackers.map((a) => (
                  <tr key={a.ip} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-3"><span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-mono font-medium">{a.ip}</span></td>
                    <td className="py-3 text-sm font-semibold text-white">{a.count}</td>
                    <td className="py-3 text-sm text-kavach-text">{a.flag} {a.location}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.count >= 15 ? 'bg-pink-500/20 text-pink-400' : a.count >= 10 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {a.count >= 15 ? 'CRITICAL' : a.count >= 10 ? 'HIGH' : 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-kavach-muted">{a.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
