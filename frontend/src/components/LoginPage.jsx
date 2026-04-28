import React, { useState, useEffect } from 'react';

// Animated floating particles background
function ParticleField() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.id % 3 === 0 ? '#00d4ff' : p.id % 3 === 1 ? '#10b981' : '#8b5cf6',
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// Animated connection lines
function GridLines() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00d4ff" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

export default function LoginPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      // Fallback to localhost if BACKEND_URL is empty
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
      
      const payload = isRegistering 
        ? { name, email, password } 
        : { email, password };

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      onLogin(data);
    } catch (err) {
      setError('Failed to connect to backend server');
      setIsLoading(false);
    }
  };

  const stats = [
    { label: 'Threats Blocked', value: '12,847', icon: '🛡️' },
    { label: 'Active Monitors', value: '5', icon: '📡' },
    { label: 'Uptime', value: '99.9%', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-[#060a13] flex relative overflow-hidden">
      {/* Background Effects */}
      <GridLines />
      <ParticleField />

      {/* Radial glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[100px] pointer-events-none" />

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative z-10">
        {/* Top — Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">CyberKavach</h1>
            <p className="text-[11px] text-kavach-muted font-medium">Real-time Cloud Security Platform</p>
          </div>
        </div>

        {/* Center — Hero Text */}
        <div className="max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Protect Your Cloud
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Infrastructure
            </span>
          </h2>
          <p className="text-kavach-muted text-base leading-relaxed mb-10">
            Real-time threat detection, automated response, and comprehensive security monitoring for your cloud infrastructure. Stay ahead of cyber threats with AI-powered defense.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: '🔍', title: 'Real-time Detection', desc: 'Monitor threats as they happen with sub-second alerting' },
              { icon: '🤖', title: 'Automated Response', desc: 'Auto-block IPs, kill processes, and isolate threats instantly' },
              { icon: '🌍', title: 'Global Threat Map', desc: 'Visualize attack origins on an interactive world map' },
            ].map((feat) => (
              <div key={feat.title} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300">
                <span className="text-2xl mt-0.5">{feat.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{feat.title}</p>
                  <p className="text-xs text-kavach-muted mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Stats bar */}
        <div className="flex items-center gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="text-xl">{stat.icon}</span>
              <div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-kavach-muted uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">CyberKavach</h1>
          </div>

          {/* Login Card */}
          <div className="bg-[#0b1120]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="text-sm text-kavach-muted">{isRegistering ? 'Register to access the dashboard' : 'Sign in to access your security dashboard'}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name (Only for Registration) */}
              {isRegistering && (
                <div>
                  <label className="block text-xs font-medium text-kavach-muted mb-2 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kavach-muted">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-kavach-muted/50 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all duration-300"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-kavach-muted mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kavach-muted">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cyberkavach.io"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-kavach-muted/50 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all duration-300"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-kavach-muted mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kavach-muted">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-kavach-muted/50 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all duration-300"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-kavach-muted hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-white/[0.15] bg-white/[0.04] flex items-center justify-center group-hover:border-cyan-500/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-50 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs text-kavach-muted">Remember me</span>
                </label>
                <a href="#" className="text-xs text-kavach-accent hover:text-cyan-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-red-400 text-sm">⚠️</span>
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-sm font-semibold
                  hover:from-cyan-400 hover:to-emerald-400 hover:shadow-lg hover:shadow-cyan-500/25
                  active:scale-[0.98] transition-all duration-300
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  isRegistering ? 'Create Account' : 'Sign In to Dashboard'
                )}
              </button>
            </form>

            {/* Mode Toggle */}
            <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-xs text-kavach-muted hover:text-white transition-colors"
              >
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            </div>

            {/* Divider */}
            {!isRegistering && (
              <>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-kavach-muted uppercase tracking-wider">Demo Credentials</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

            {/* Quick login hint */}
            <button
              onClick={() => { setEmail('admin@cyberkavach.io'); setPassword('admin123'); }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors">admin@cyberkavach.io</p>
                <p className="text-[10px] text-kavach-muted">Click to autofill demo account</p>
              </div>
            </button>
            </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-kavach-muted/50">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] text-kavach-muted/40 mt-1">Cyber Kavach v1.0 · Secured Connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
