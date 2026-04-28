import React, { useState } from 'react';

export default function SettingsPage() {
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [alertEmail, setAlertEmail] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-kavach-muted mt-0.5">Configure application preferences</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Email Notifications</h3>
          {[
            { label: 'SMTP Host', value: smtpHost, set: setSmtpHost },
            { label: 'SMTP Port', value: smtpPort, set: setSmtpPort },
            { label: 'Alert Email', value: alertEmail, set: setAlertEmail, placeholder: 'admin@example.com' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-kavach-muted mb-1 block">{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder || ''}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-kavach-muted focus:outline-none focus:border-kavach-accent/40 transition-colors" />
            </div>
          ))}
          <button onClick={handleSave}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-kavach-accent text-white hover:bg-kavach-accent/80'}`}>
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">System Information</h3>
          {[
            { label: 'Backend URL', value: 'http://localhost:8000' },
            { label: 'WebSocket', value: 'ws://localhost:8000/ws' },
            { label: 'API Version', value: 'v1.0.0' },
            { label: 'Agent', value: 'Cyber Kavach Agent' },
          ].map(i => (
            <div key={i.label} className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-kavach-muted">{i.label}</span>
              <span className="text-xs text-kavach-text font-mono">{i.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
