import React, { useState, useEffect, useRef } from 'react';
import { severityColors, alertTypeIcons } from '../data/mockData';

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function SeverityDot({ severity }) {
  const dotColor = { CRITICAL: 'bg-pink-500', HIGH: 'bg-red-500', MEDIUM: 'bg-amber-500', LOW: 'bg-emerald-500' };
  return <span className={`w-2 h-2 rounded-full ${dotColor[severity] || 'bg-gray-500'} animate-pulse`} />;
}

export default function LiveMonitorPage({ alerts, isConnected }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const feedRef = useRef(null);

  useEffect(() => {
    if (autoScroll && feedRef.current) { feedRef.current.scrollTop = 0; }
  }, [alerts, autoScroll]);

  const last5min = alerts.filter((a) => {
    const ts = new Date(a.timestamp);
    return Date.now() - ts.getTime() < 5 * 60 * 1000;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Monitor</h1>
          <p className="text-sm text-kavach-muted mt-0.5">Real-time security event feed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs font-semibold">{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Connection</p>
          <p className={`text-lg font-bold mt-1 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>{isConnected ? 'Active' : 'Offline'}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Events (Last 5min)</p>
          <p className="text-lg font-bold mt-1 text-white">{last5min.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Total Events</p>
          <p className="text-lg font-bold mt-1 text-cyan-400">{alerts.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Auto Scroll</p>
          <button onClick={() => setAutoScroll(!autoScroll)}
            className={`mt-1 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${autoScroll ? 'bg-kavach-accent text-white' : 'bg-white/[0.06] text-kavach-muted'}`}>
            {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Event Feed
          </h3>
          <span className="text-xs text-kavach-muted">{alerts.length} events</span>
        </div>
        <div ref={feedRef} className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-kavach-muted text-sm">Waiting for events...</div>
          ) : alerts.map((alert, idx) => (
            <div key={alert.id || idx}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-xs transition-all duration-300 ${
                idx === 0 ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-white/[0.02] hover:bg-white/[0.04]'
              }`}>
              <SeverityDot severity={alert.severity} />
              <span className="text-kavach-muted w-20 flex-shrink-0">{formatTime(alert.timestamp)}</span>
              <span className="text-base flex-shrink-0">{alertTypeIcons[alert.type] || '⚠️'}</span>
              <span className="text-kavach-text flex-shrink-0 w-28 truncate">{alert.type?.replace('_', ' ')}</span>
              <span className="text-red-400 w-28 flex-shrink-0">{alert.ip}</span>
              <span className="text-white flex-1 truncate">{alert.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                alert.severity === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
                alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                alert.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>{alert.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
