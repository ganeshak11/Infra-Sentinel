import React, { useState } from 'react';
import { severityColors, alertTypeIcons } from '../data/mockData';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function SeverityBadge({ severity }) {
  const c = severityColors[severity] || severityColors.MEDIUM;
  return <span className={`severity-badge ${c.bg} ${c.text} border ${c.border}`}>{severity}</span>;
}

export default function SearchPage({ alerts }) {
  const [query, setQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const results = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return [a.label, a.description, a.ip, a.reason, a.process, a.server, a.type, a.action]
      .some(f => f?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Search across all security events</p>
      </div>
      <div className="glass-card p-5">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by IP, type, description, process..."
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3.5 text-sm text-white placeholder-kavach-muted focus:outline-none focus:border-kavach-accent/50 transition-all" autoFocus />
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
            {severities.map((sev) => (
              <button key={sev} onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterSeverity === sev ? 'bg-kavach-accent text-white' : 'text-kavach-muted hover:text-kavach-text'}`}>
                {sev}
              </button>
            ))}
          </div>
          <span className="text-xs text-kavach-muted ml-auto">{results.length} results</span>
        </div>
      </div>
      <div className="space-y-2">
        {results.length === 0 ? (
          <div className="glass-card p-12 text-center"><p className="text-3xl mb-3">🔍</p><p className="text-kavach-muted">{query ? 'No results found.' : 'Type to search.'}</p></div>
        ) : results.map((alert, idx) => (
          <div key={alert.id || idx} className="glass-card p-4 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-xl mt-0.5">{alertTypeIcons[alert.type] || '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-semibold text-white">{alert.label}</p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-xs text-kavach-muted mb-2">{alert.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-kavach-muted">
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">{alert.ip}</span>
                  <span>Process: <span className="text-kavach-text">{alert.process}</span></span>
                  <span>Action: <span className="text-kavach-text">{alert.action}</span></span>
                  <span className="ml-auto">{formatTime(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
