import React from 'react';
import {
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineBan,
  HiOutlineServer,
  HiOutlineExclamation,
} from 'react-icons/hi';

const cards = [
  {
    title: 'Security Score',
    icon: HiOutlineShieldCheck,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    format: 'score',
  },
  {
    title: 'Total Alerts',
    icon: HiOutlineBell,
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    key: 'totalAlerts',
    delta: 'alertsDelta',
    deltaLabel: 'from last 24h',
  },
  {
    title: 'Blocked Attacks',
    icon: HiOutlineBan,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    key: 'blockedAttacks',
    delta: 'blockedDelta',
    deltaLabel: 'from last 24h',
  },
  {
    title: 'Monitored Servers',
    icon: HiOutlineServer,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    key: 'monitoredServers',
    subtitle: 'All servers active',
  },
  {
    title: 'Active Threats',
    icon: HiOutlineExclamation,
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    key: 'activeThreats',
    subtitle: 'Requires attention',
    subtitleColor: 'text-amber-400',
  },
];

export default function StatCards({ counters }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="glass-card-hover p-5 flex flex-col gap-3"
        >
          {/* Top row: icon + title */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-kavach-muted uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`stat-card-icon ${card.iconBg}`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>

          {/* Value */}
          {card.format === 'score' ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{counters.securityScore}</span>
                <span className="text-sm text-kavach-muted font-medium">/100</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000"
                  style={{ width: `${counters.securityScore}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs font-medium text-emerald-400">Excellent Protection</p>
            </div>
          ) : (
            <div>
              <span className="text-3xl font-bold text-white">{counters[card.key]}</span>
              {card.delta && (
                <p className="mt-1 text-xs text-kavach-muted">
                  <span className="text-emerald-400 font-medium">↑ {counters[card.delta]}%</span>
                  {' '}{card.deltaLabel}
                </p>
              )}
              {card.subtitle && (
                <p className={`mt-1 text-xs font-medium ${card.subtitleColor || 'text-emerald-400'}`}>
                  {card.key === 'monitoredServers' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 align-middle" />}
                  {card.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
