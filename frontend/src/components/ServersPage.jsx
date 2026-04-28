import React from 'react';

const servers = [
  { name: 'Web Server 01', status: 'online', ip: '10.0.1.10', cpu: 34, mem: 62, alerts: 4 },
  { name: 'App Server 02', status: 'online', ip: '10.0.1.20', cpu: 67, mem: 78, alerts: 2 },
  { name: 'Database 01', status: 'online', ip: '10.0.1.30', cpu: 45, mem: 81, alerts: 1 },
  { name: 'Web Server 02', status: 'online', ip: '10.0.1.40', cpu: 22, mem: 55, alerts: 3 },
  { name: 'Host Agent', status: 'online', ip: '10.0.1.50', cpu: 12, mem: 40, alerts: 0 },
];

export default function ServersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Servers</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Manage and monitor all connected servers</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((srv) => (
          <div key={srv.name} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">{srv.name}</h3>
              </div>
              <span className="text-[10px] font-mono text-kavach-muted">{srv.ip}</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-kavach-muted">CPU</span><span className="text-kavach-text">{srv.cpu}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${srv.cpu > 80 ? 'bg-red-500' : srv.cpu > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${srv.cpu}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-kavach-muted">Memory</span><span className="text-kavach-text">{srv.mem}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${srv.mem > 80 ? 'bg-red-500' : srv.mem > 60 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${srv.mem}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-kavach-muted">Alerts</span>
                <span className={srv.alerts > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>{srv.alerts}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
