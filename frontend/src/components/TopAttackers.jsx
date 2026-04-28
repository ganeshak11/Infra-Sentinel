import React, { useState, useEffect } from 'react';

const BACKEND_URL = '';

export default function TopAttackers() {
  const [attackers, setAttackers] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/attackers`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAttackers(data);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/api/attackers`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setAttackers(data);
          }
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Top Attacking IPs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider pb-3">IP Address</th>
              <th className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider pb-3">Attack Count</th>
              <th className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider pb-3">Type</th>
              <th className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider pb-3">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {attackers.map((attacker, idx) => (
              <tr key={attacker.ip} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-mono font-medium">
                    {attacker.ip}
                  </span>
                </td>
                <td className="py-3 text-sm font-semibold text-white">{attacker.count}</td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                    attacker.type === 'brute_force' ? 'bg-amber-500/10 text-amber-400' : 'bg-pink-500/10 text-pink-400'
                  }`}>{(attacker.type || 'unknown').replace('_', ' ')}</span>
                </td>
                <td className="py-3 text-xs text-kavach-muted">{attacker.last_seen ? new Date(attacker.last_seen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right">
        <a href="#" className="text-xs font-medium text-kavach-accent hover:text-cyan-300 transition-colors">
          View All Attackers →
        </a>
      </div>
    </div>
  );
}
