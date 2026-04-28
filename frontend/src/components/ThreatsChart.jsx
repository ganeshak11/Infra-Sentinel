import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const BACKEND_URL = '';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-white/10 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-xs font-semibold text-kavach-muted mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ThreatsChart() {
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/threats-timeline`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTimelineData(data);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/api/threats-timeline`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setTimelineData(data);
          }
        })
        .catch(() => {});
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white">Threats Over Time</h3>
        <select className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-kavach-muted focus:outline-none focus:border-kavach-accent/30 cursor-pointer">
          <option>24 Hours</option>
          <option>7 Days</option>
          <option>30 Days</option>
        </select>
      </div>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-[11px] text-kavach-muted">Brute Force</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-[11px] text-kavach-muted">Reverse Shell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span className="text-[11px] text-kavach-muted">Other Attacks</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradBrute" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradShell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: '#7d8590', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} interval={3} />
          <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="bruteForce" name="Brute Force" stroke="#f87171" strokeWidth={2} fill="url(#gradBrute)" />
          <Area type="monotone" dataKey="reverseShell" name="Reverse Shell" stroke="#22d3ee" strokeWidth={2} fill="url(#gradShell)" />
          <Area type="monotone" dataKey="otherAttacks" name="Other Attacks" stroke="#a78bfa" strokeWidth={2} fill="url(#gradOther)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
