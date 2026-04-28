import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineBell } from 'react-icons/hi';
import { severityColors, alertTypeIcons } from '../data/mockData';

function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header({ alerts = [], onNavigate, user, onLogout }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Show recent critical/high alerts as "unread" notifications
  const recentAlerts = alerts.filter(a =>
    a.severity === 'CRITICAL' || a.severity === 'HIGH'
  ).slice(0, 5);

  const unreadCount = Math.min(recentAlerts.length, 99);

  return (
    <header className="flex items-center justify-between mb-6">
      {/* Left — Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Real-time overview of your cloud security</p>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
          >
            <HiOutlineBell className="w-5 h-5 text-kavach-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                <span className="text-[10px] text-kavach-muted">{unreadCount} high priority</span>
              </div>

              {/* Alert List */}
              <div className="max-h-[320px] overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-kavach-muted text-sm">No critical alerts</p>
                  </div>
                ) : (
                  recentAlerts.map((alert, idx) => {
                    const sevColor = alert.severity === 'CRITICAL' ? 'bg-pink-500' : 'bg-red-500';
                    return (
                      <div
                        key={alert.id || idx}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-white/[0.04] last:border-0"
                        onClick={() => { setShowNotifs(false); if (onNavigate) onNavigate('Alerts'); }}
                      >
                        <div className="mt-1 flex-shrink-0">
                          <span className={`block w-2 h-2 rounded-full ${sevColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{alertTypeIcons[alert.type] || '⚠️'}</span>
                            <p className="text-xs font-semibold text-white truncate capitalize">{alert.type ? alert.type.replace(/_/g, ' ') : 'Unknown Alert'}</p>
                          </div>
                          <p className="text-[11px] text-kavach-muted mt-0.5 truncate">{alert.reason || '—'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-red-400">{alert.ip}</span>
                            <span className="text-[10px] text-kavach-muted">·</span>
                            <span className="text-[10px] text-kavach-muted">{timeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                        <span className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                          alert.severity === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.06] px-4 py-2.5">
                <button
                  onClick={() => { setShowNotifs(false); if (onNavigate) onNavigate('Alerts'); }}
                  className="w-full text-center text-xs font-medium text-kavach-accent hover:text-cyan-300 transition-colors"
                >
                  View All Alerts →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/[0.08]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-white leading-tight">{user?.name || 'User'}</p>
            <p className="text-[11px] text-kavach-muted leading-tight">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
