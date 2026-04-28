import React from 'react';
import {
  HiOutlineShieldCheck,
  HiOutlineTerminal,
  HiOutlineStatusOnline,
  HiOutlineEye,
  HiOutlineFolder,
  HiOutlineServer,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCog,
  HiOutlineExclamationCircle,
  HiOutlineDesktopComputer,
  HiOutlineSearch,
  HiOutlineLightningBolt,
} from 'react-icons/hi';

const pageConfig = {
  'Incidents': { icon: HiOutlineExclamationCircle, color: 'from-red-500 to-orange-500', description: 'Track and manage security incidents across your infrastructure.', features: ['Incident timeline & history', 'Severity classification', 'Automated response workflows', 'Root cause analysis'] },
  'Live Monitor': { icon: HiOutlineDesktopComputer, color: 'from-cyan-500 to-blue-500', description: 'Real-time monitoring of all active connections and processes.', features: ['Live process tree', 'Active network connections', 'Resource utilization', 'Anomaly detection'] },
  'Search': { icon: HiOutlineSearch, color: 'from-violet-500 to-purple-500', description: 'Search across all logs, alerts, and security events.', features: ['Full-text search', 'Advanced query syntax', 'Saved searches', 'Export results'] },
  'Threat Intelligence': { icon: HiOutlineLightningBolt, color: 'from-amber-500 to-red-500', description: 'Threat intelligence feeds and indicator-of-compromise (IOC) tracking.', features: ['IOC database', 'Threat feed integration', 'IP reputation scoring', 'Malware signature matching'] },
  'Brute Force Protection': { icon: HiOutlineShieldCheck, color: 'from-emerald-500 to-teal-500', description: 'Configure brute force detection thresholds and auto-blocking rules.', features: ['Login attempt thresholds', 'Auto IP blocking', 'Whitelist management', 'Attack pattern analysis'] },
  'Reverse Shell Detection': { icon: HiOutlineTerminal, color: 'from-pink-500 to-rose-500', description: 'Monitor for reverse shell connections and suspicious outbound sessions.', features: ['Shell process monitoring', 'Outbound connection alerts', 'Auto process termination', 'Forensic logging'] },
  'Network Monitoring': { icon: HiOutlineStatusOnline, color: 'from-blue-500 to-cyan-500', description: 'Monitor network traffic for anomalies and unauthorized connections.', features: ['Traffic analysis', 'Port scanning detection', 'DNS monitoring', 'Bandwidth alerts'] },
  'Process Monitoring': { icon: HiOutlineEye, color: 'from-indigo-500 to-violet-500', description: 'Track running processes and detect unauthorized executables.', features: ['Process whitelist', 'CPU/memory alerts', 'Suspicious process detection', 'Process history'] },
  'File Integrity': { icon: HiOutlineFolder, color: 'from-teal-500 to-emerald-500', description: 'Monitor critical files for unauthorized modifications.', features: ['File hash monitoring', 'Change detection', 'Baseline management', 'Rollback support'] },
  'Servers': { icon: HiOutlineServer, color: 'from-slate-500 to-gray-500', description: 'Manage and monitor all connected servers and agents.', features: ['Server inventory', 'Agent health status', 'Resource monitoring', 'Deployment management'] },
  'Policies': { icon: HiOutlineDocumentText, color: 'from-orange-500 to-amber-500', description: 'Define and manage security policies for your infrastructure.', features: ['Policy templates', 'Rule configuration', 'Compliance checks', 'Policy versioning'] },
  'Users': { icon: HiOutlineUsers, color: 'from-fuchsia-500 to-pink-500', description: 'Manage user accounts, roles, and access permissions.', features: ['User management', 'Role-based access', 'Activity logs', 'Two-factor authentication'] },
  'Settings': { icon: HiOutlineCog, color: 'from-gray-500 to-slate-600', description: 'Configure global application settings and integrations.', features: ['Email notifications', 'API keys', 'Webhook configuration', 'System preferences'] },
};

export default function PlaceholderPage({ pageName }) {
  const config = pageConfig[pageName] || {
    icon: HiOutlineExclamationCircle,
    color: 'from-gray-500 to-gray-600',
    description: 'This page is under development.',
    features: [],
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{pageName}</h1>
        <p className="text-sm text-kavach-muted mt-0.5">{config.description}</p>
      </div>
      <div className="glass-card p-8 flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-6 shadow-lg`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-sm text-kavach-muted max-w-md mb-8">
          The <span className="text-kavach-text font-medium">{pageName}</span> module is currently under development.
          It will be available in a future update.
        </p>
        {config.features.length > 0 && (
          <div className="w-full max-w-lg">
            <h3 className="text-xs font-semibold text-kavach-muted uppercase tracking-wider mb-4">Planned Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color} flex-shrink-0`} />
                  <span className="text-sm text-kavach-text">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Dashboard' }))}
          className="mt-8 px-6 py-2.5 rounded-lg bg-kavach-accent text-white text-sm font-medium hover:bg-kavach-accent/80 transition-colors shadow-lg shadow-kavach-accent/20"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
