import React from 'react';
import {
  HiOutlineViewGrid,
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineDesktopComputer,
  HiOutlineSearch,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineTerminal,
  HiOutlineStatusOnline,
  HiOutlineCog,
  HiOutlineServer,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineFolder,
} from 'react-icons/hi';

const navSections = [
  {
    items: [
      { icon: HiOutlineViewGrid, label: 'Dashboard' },
      { icon: HiOutlineBell, label: 'Alerts', badge: 12 },
      { icon: HiOutlineExclamationCircle, label: 'Incidents' },
      { icon: HiOutlineDesktopComputer, label: 'Live Monitor' },
      { icon: HiOutlineSearch, label: 'Search' },
      { icon: HiOutlineLightningBolt, label: 'Threat Intelligence' },
    ],
  },
  {
    title: 'PROTECTION',
    items: [
      { icon: HiOutlineShieldCheck, label: 'Brute Force Protection' },
      { icon: HiOutlineTerminal, label: 'Reverse Shell Detection' },
      { icon: HiOutlineStatusOnline, label: 'Network Monitoring' },
      { icon: HiOutlineEye, label: 'Process Monitoring' },
      { icon: HiOutlineFolder, label: 'File Integrity' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { icon: HiOutlineServer, label: 'Servers' },
      { icon: HiOutlineDocumentText, label: 'Policies' },
      { icon: HiOutlineUsers, label: 'Users' },
      { icon: HiOutlineCog, label: 'Settings' },
    ],
  },
];

export default function Sidebar({ isConnected, activePage, onNavigate }) {
  return (
    <aside className="w-[260px] h-screen bg-[#0b1120] border-r border-white/[0.06] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">CyberKavach</h1>
            <p className="text-[10px] text-kavach-muted font-medium">Real-time Cloud Security</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="px-4 mb-2 text-[10px] font-semibold text-kavach-muted/60 uppercase tracking-[0.15em]">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activePage === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => onNavigate(item.label)}
                    className={`sidebar-link group w-full text-left ${isActive ? 'active' : ''}`}
                  >
                    <item.icon
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-kavach-accent' : 'text-kavach-muted group-hover:text-kavach-text'
                      } transition-colors`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Agent Status */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0b1120] ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Agent is {isConnected ? 'Active' : 'Offline'}</p>
            <p className="text-[10px] text-kavach-muted">
              {isConnected ? '● ' : '○ '}
              <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
                {isConnected ? 'All systems are protected' : 'Connection lost'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
