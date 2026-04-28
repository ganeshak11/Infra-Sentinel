import React, { useState } from 'react';
import { severityColors, alertTypeIcons } from '../data/mockData';

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function SeverityBadge({ severity }) {
  const colors = severityColors[severity] || severityColors.MEDIUM;
  return <span className={`severity-badge ${colors.bg} ${colors.text} border ${colors.border}`}>{severity}</span>;
}

export default function IncidentsPage({ alerts }) {
  const [expandedIncident, setExpandedIncident] = useState(null);

  const incidentMap = {};
  alerts.forEach((alert) => {
    const ip = alert.ip || 'unknown';
    if (!incidentMap[ip]) {
      incidentMap[ip] = { ip, alerts: [], highestSeverity: 'LOW', firstSeen: alert.timestamp, lastSeen: alert.timestamp, types: new Set() };
    }
    incidentMap[ip].alerts.push(alert);
    incidentMap[ip].types.add(alert.type);
    const sevOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    if ((sevOrder[alert.severity] || 0) > (sevOrder[incidentMap[ip].highestSeverity] || 0)) {
      incidentMap[ip].highestSeverity = alert.severity;
    }
    if (new Date(alert.timestamp) < new Date(incidentMap[ip].firstSeen)) incidentMap[ip].firstSeen = alert.timestamp;
    if (new Date(alert.timestamp) > new Date(incidentMap[ip].lastSeen)) incidentMap[ip].lastSeen = alert.timestamp;
  });

  const incidents = Object.values(incidentMap).sort((a, b) => {
    const sevOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (sevOrder[b.highestSeverity] || 0) - (sevOrder[a.highestSeverity] || 0);
  });

  const statusColors = { CRITICAL: 'border-l-pink-500', HIGH: 'border-l-red-500', MEDIUM: 'border-l-amber-500', LOW: 'border-l-emerald-500' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Incidents</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Security incidents grouped by source IP ({incidents.length} active sources)</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: incidents.length, color: 'text-white' },
          { label: 'Critical', value: incidents.filter(i => i.highestSeverity === 'CRITICAL').length, color: 'text-pink-400' },
          { label: 'High', value: incidents.filter(i => i.highestSeverity === 'HIGH').length, color: 'text-red-400' },
          { label: 'Total Alerts', value: alerts.length, color: 'text-cyan-400' },
        ].map((card) => (
          <div key={card.label} className="glass-card p-4">
            <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="glass-card p-12 text-center"><p className="text-kavach-muted">No incidents recorded yet.</p></div>
        ) : incidents.map((incident) => (
          <div key={incident.ip} className={`glass-card border-l-4 ${statusColors[incident.highestSeverity]} overflow-hidden transition-all duration-300`}>
            <button onClick={() => setExpandedIncident(expandedIncident === incident.ip ? null : incident.ip)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-mono font-medium">{incident.ip}</span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {incident.alerts.length} alert{incident.alerts.length > 1 ? 's' : ''} · {[...incident.types].map(t => t.replace('_', ' ')).join(', ')}
                  </p>
                  <p className="text-xs text-kavach-muted mt-0.5">First seen: {formatTime(incident.firstSeen)} · Last seen: {formatTime(incident.lastSeen)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SeverityBadge severity={incident.highestSeverity} />
                <span className="text-kavach-muted text-lg">{expandedIncident === incident.ip ? '▲' : '▼'}</span>
              </div>
            </button>
            {expandedIncident === incident.ip && (
              <div className="border-t border-white/[0.06] px-5 pb-4">
                <div className="space-y-2 mt-3">
                  {incident.alerts.map((alert, idx) => (
                    <div key={alert.id || idx} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-base">{alertTypeIcons[alert.type] || '⚠️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{alert.label}</p>
                        <p className="text-xs text-kavach-muted truncate">{alert.description}</p>
                      </div>
                      <span className="text-xs text-kavach-muted whitespace-nowrap">{alert.action}</span>
                      <span className="text-xs text-kavach-muted whitespace-nowrap">{formatTime(alert.timestamp)}</span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
