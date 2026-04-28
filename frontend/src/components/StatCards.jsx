import React from 'react';
import {
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineBan,
  HiOutlineExclamationCircle,
  HiOutlineFire,
} from 'react-icons/hi';

export default function StatCards({ counters, alerts = [] }) {
  // Derive all stats directly from real alert data
  const totalAlerts = alerts.length;
  const blockedAttacks = alerts.filter(a => a.action === 'IP_BLOCKED' || a.action === 'PROCESS_KILLED').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
  const activeThreats = criticalAlerts + highAlerts;

  // Security score: starts at 100, loses points for each unresolved threat
  const securityScore = Math.max(0, 100 - criticalAlerts * 10 - highAlerts * 3);

  const cards = [
    {
      title: 'Security Score',
      value: `${securityScore}`,
      suffix: '/100',
      icon: HiOutlineShieldCheck,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      sub: securityScore >= 80 ? 'Good Protection' : securityScore >= 50 ? 'At Risk' : 'Critical State',
      subColor: securityScore >= 80 ? 'text-emerald-400' : securityScore >= 50 ? 'text-amber-400' : 'text-red-400',
      showBar: true,
      barPct: securityScore,
    },
    {
      title: 'Total Alerts',
      value: totalAlerts,
      icon: HiOutlineBell,
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
      sub: totalAlerts === 0 ? 'No alerts yet' : `${criticalAlerts} critical`,
      subColor: criticalAlerts > 0 ? 'text-pink-400' : 'text-kavach-muted',
    },
    {
      title: 'Blocked Attacks',
      value: blockedAttacks,
      icon: HiOutlineBan,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      sub: blockedAttacks === 0 ? 'None blocked yet' : 'IPs blocked / processes killed',
      subColor: 'text-kavach-muted',
    },
    {
      title: 'Active Threats',
      value: activeThreats,
      icon: HiOutlineFire,
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400',
      sub: activeThreats === 0 ? 'All clear' : 'Requires attention',
      subColor: activeThreats > 0 ? 'text-amber-400' : 'text-emerald-400',
    },
    {
      title: 'Critical Alerts',
      value: criticalAlerts,
      icon: HiOutlineExclamationCircle,
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-400',
      sub: criticalAlerts === 0 ? 'No critical alerts' : 'Immediate action needed',
      subColor: criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.title} className="glass-card-hover p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-kavach-muted uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`stat-card-icon ${card.iconBg}`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{card.value}</span>
              {card.suffix && <span className="text-sm text-kavach-muted font-medium">{card.suffix}</span>}
            </div>
            {card.showBar && (
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000"
                  style={{ width: `${card.barPct}%` }}
                />
              </div>
            )}
            {card.sub && (
              <p className={`mt-1 text-xs font-medium ${card.subColor}`}>{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
