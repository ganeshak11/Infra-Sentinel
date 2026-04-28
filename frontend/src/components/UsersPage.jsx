import React, { useState } from 'react';

const defaultUsers = [
  { id: 1, name: 'Admin', email: 'admin@cyberkavach.io', role: 'Super Admin', status: 'active', lastLogin: '2026-04-24T12:30:00Z', avatar: 'A' },
  { id: 2, name: 'Chinmay', email: 'chinmay@cyberkavach.io', role: 'Admin', status: 'active', lastLogin: '2026-04-24T11:15:00Z', avatar: 'C' },
  { id: 3, name: 'Security Bot', email: 'bot@cyberkavach.io', role: 'System', status: 'active', lastLogin: '2026-04-24T12:45:00Z', avatar: 'S' },
  { id: 4, name: 'Analyst', email: 'analyst@cyberkavach.io', role: 'Viewer', status: 'active', lastLogin: '2026-04-23T09:20:00Z', avatar: 'N' },
  { id: 5, name: 'Dev Team', email: 'dev@cyberkavach.io', role: 'Editor', status: 'inactive', lastLogin: '2026-04-20T14:00:00Z', avatar: 'D' },
];

const roleColors = {
  'Super Admin': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Admin': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Editor': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Viewer': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'System': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const avatarGradients = ['from-violet-500 to-fuchsia-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-pink-500 to-rose-500'];

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function UsersPage() {
  const [users, setUsers] = useState(defaultUsers);
  const [showAdd, setShowAdd] = useState(false);
  const activeCount = users.filter(u => u.status === 'active').length;

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-kavach-muted mt-0.5">Manage user accounts and access permissions</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-kavach-accent text-white text-sm font-medium hover:bg-kavach-accent/80 transition-colors shadow-lg shadow-kavach-accent/20">
          + Add User
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold mt-1 text-white">{users.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-bold mt-1 text-kavach-muted">{users.length - activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-kavach-muted uppercase tracking-wider">Roles</p>
          <p className="text-2xl font-bold mt-1 text-cyan-400">{new Set(users.map(u => u.role)).size}</p>
        </div>
      </div>
      {showAdd && (
        <div className="glass-card p-5 border border-kavach-accent/20">
          <h3 className="text-sm font-semibold text-white mb-4">Add New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Full Name" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-kavach-muted focus:outline-none focus:border-kavach-accent/40" />
            <input type="email" placeholder="Email" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-kavach-muted focus:outline-none focus:border-kavach-accent/40" />
            <select className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-kavach-muted focus:outline-none focus:border-kavach-accent/40 cursor-pointer">
              <option>Viewer</option><option>Editor</option><option>Admin</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="px-4 py-2 rounded-lg bg-kavach-accent text-white text-sm font-medium hover:bg-kavach-accent/80 transition-colors">Create User</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-white/[0.06] text-kavach-muted text-sm font-medium hover:bg-white/[0.1] transition-colors">Cancel</button>
          </div>
        </div>
      )}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['User','Role','Status','Last Login','Actions'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-kavach-muted uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} flex items-center justify-center text-sm font-bold text-white`}>
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-[11px] text-kavach-muted">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${roleColors[user.role] || 'bg-gray-500/15 text-gray-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    <span className={`text-xs font-medium ${user.status === 'active' ? 'text-emerald-400' : 'text-kavach-muted'}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-kavach-muted">{formatDate(user.lastLogin)}</td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleStatus(user.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      user.status === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}>
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
