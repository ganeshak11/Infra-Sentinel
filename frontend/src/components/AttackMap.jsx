import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { attackMapPoints as mockPoints } from '../data/mockData';

const BACKEND_URL = '';
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const countryNames = {
  '004':'Afghanistan','008':'Albania','012':'Algeria','024':'Angola','032':'Argentina',
  '036':'Australia','040':'Austria','050':'Bangladesh','056':'Belgium','076':'Brazil',
  '100':'Bulgaria','104':'Myanmar','116':'Cambodia','120':'Cameroon','124':'Canada',
  '144':'Sri Lanka','152':'Chile','156':'China','170':'Colombia','180':'DR Congo',
  '188':'Costa Rica','191':'Croatia','192':'Cuba','196':'Cyprus','203':'Czech Republic',
  '208':'Denmark','218':'Ecuador','818':'Egypt','222':'El Salvador','231':'Ethiopia',
  '233':'Estonia','246':'Finland','250':'France','276':'Germany','288':'Ghana',
  '300':'Greece','320':'Guatemala','332':'Haiti','340':'Honduras','348':'Hungary',
  '352':'Iceland','356':'India','360':'Indonesia','364':'Iran','368':'Iraq',
  '372':'Ireland','376':'Israel','380':'Italy','388':'Jamaica','392':'Japan',
  '400':'Jordan','398':'Kazakhstan','404':'Kenya','410':'South Korea','414':'Kuwait',
  '418':'Laos','422':'Lebanon','434':'Libya','440':'Lithuania','458':'Malaysia',
  '484':'Mexico','496':'Mongolia','504':'Morocco','508':'Mozambique','516':'Namibia',
  '524':'Nepal','528':'Netherlands','554':'New Zealand','558':'Nicaragua','566':'Nigeria',
  '578':'Norway','586':'Pakistan','591':'Panama','598':'Papua New Guinea','600':'Paraguay',
  '604':'Peru','608':'Philippines','616':'Poland','620':'Portugal','642':'Romania',
  '643':'Russia','682':'Saudi Arabia','686':'Senegal','688':'Serbia','694':'Sierra Leone',
  '702':'Singapore','703':'Slovakia','704':'Vietnam','706':'Somalia','710':'South Africa',
  '716':'Zimbabwe','724':'Spain','736':'Sudan','740':'Suriname','752':'Sweden',
  '756':'Switzerland','760':'Syria','762':'Tajikistan','764':'Thailand','780':'Trinidad',
  '784':'UAE','788':'Tunisia','792':'Turkey','800':'Uganda','804':'Ukraine',
  '826':'United Kingdom','840':'United States','858':'Uruguay','860':'Uzbekistan',
  '862':'Venezuela','887':'Yemen','894':'Zambia','-99':'N. Cyprus','010':'Antarctica',
};

const geoCoords = {
  'United States': [-95, 38], 'Russia': [60, 55], 'Germany': [10, 51],
  'China': [105, 35], 'France': [2, 47], 'India': [78, 22],
  'Brazil': [-51, -10], 'Japan': [138, 36], 'Australia': [134, -25],
  'United Kingdom': [-2, 54], 'Local Network': [-95, 38],
  'Private Network': [-95, 38], 'Unknown': [20, 20],
};

const SERVER_COORDS = [78, 22];

const sevStyle = {
  CRITICAL: { fill: '#ec4899', glow: 'rgba(236,72,153,0.5)', outer: 'rgba(236,72,153,0.15)', stroke: '#ec4899' },
  HIGH:     { fill: '#ef4444', glow: 'rgba(239,68,68,0.5)',   outer: 'rgba(239,68,68,0.15)',  stroke: '#ef4444' },
  MEDIUM:   { fill: '#f59e0b', glow: 'rgba(245,158,11,0.5)',  outer: 'rgba(245,158,11,0.15)', stroke: '#f59e0b' },
  LOW:      { fill: '#10b981', glow: 'rgba(16,185,129,0.5)',   outer: 'rgba(16,185,129,0.15)', stroke: '#10b981' },
};

export default function AttackMap() {
  const [attackers, setAttackers] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    const fetchData = () => {
      fetch(`${BACKEND_URL}/api/attackers`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data) && data.length > 0) setAttackers(data); })
        .catch(() => {});
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const markers = attackers.length > 0
    ? attackers.map(a => {
        const coords = geoCoords[a.location] || geoCoords['Unknown'];
        const sev = a.count >= 15 ? 'CRITICAL' : a.count >= 10 ? 'HIGH' : a.count >= 5 ? 'MEDIUM' : 'LOW';
        return { ...a, coords, severity: sev };
      })
    : [
        { ip: '203.0.113.45', count: 4, location: 'United States', flag: '🇺🇸', coords: geoCoords['United States'], severity: 'HIGH' },
        { ip: '198.51.100.23', count: 8, location: 'Russia', flag: '🇷🇺', coords: geoCoords['Russia'], severity: 'CRITICAL' },
        { ip: '91.189.88.142', count: 3, location: 'Germany', flag: '🇩🇪', coords: geoCoords['Germany'], severity: 'MEDIUM' },
        { ip: '185.220.101.1', count: 5, location: 'China', flag: '🇨🇳', coords: geoCoords['China'], severity: 'HIGH' },
        { ip: '45.33.32.156', count: 2, location: 'Brazil', flag: '🇧🇷', coords: geoCoords['Brazil'], severity: 'MEDIUM' },
      ];

  const renderMapContent = (isExpanded) => (
    <>
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const cId = geo.id || geo.properties?.name;
            const cName = countryNames[cId] || geo.properties?.name || 'Unknown';
            return (
              <Geography key={geo.rsmKey} geography={geo}
                fill={hoveredCountry === cName ? '#223a58' : '#1a2942'}
                stroke={hoveredCountry === cName ? '#4a8adb' : '#2e4a6e'}
                strokeWidth={hoveredCountry === cName ? 1 : 0.5}
                onMouseEnter={() => setHoveredCountry(cName)}
                onMouseLeave={() => setHoveredCountry('')}
                style={{
                  default: { outline: 'none', transition: 'all 0.2s' },
                  hover: { fill: '#223a58', stroke: '#4a8adb', strokeWidth: 1, outline: 'none', cursor: 'pointer' },
                  pressed: { outline: 'none' },
                }}
              />
            );
          })
        }
      </Geographies>
      {markers.map((m, i) => {
        const s = sevStyle[m.severity] || sevStyle.LOW;
        return <Line key={`l-${i}`} from={m.coords} to={SERVER_COORDS} stroke={s.stroke}
          strokeWidth={isExpanded ? 1.5 : 1} strokeLinecap="round" strokeDasharray="4 3" strokeOpacity={0.5} curve />;
      })}
      <Marker coordinates={SERVER_COORDS}>
        <circle r={isExpanded ? 10 : 8} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={1} />
        <circle r={isExpanded ? 5 : 4} fill="#3b82f6" />
        <text x={12} y={4} fill="#3b82f6" fontSize={isExpanded ? 10 : 8} fontWeight={700} fontFamily="Inter">SERVER</text>
      </Marker>
      {markers.map((m, i) => {
        const s = sevStyle[m.severity] || sevStyle.LOW;
        return (
          <Marker key={`m-${i}`} coordinates={m.coords}
            onMouseEnter={() => setTooltip(m)} onMouseLeave={() => setTooltip(null)}>
            <circle r={isExpanded ? 16 : 12} fill={s.outer} />
            <circle r={isExpanded ? 8 : 6} fill={s.glow} />
            <circle r={isExpanded ? 4 : 3} fill={s.fill} />
          </Marker>
        );
      })}
    </>
  );

  const renderTooltips = () => (
    <>
      {tooltip && (
        <div className="absolute top-3 right-3 bg-[#111827]/95 border border-white/[0.1] rounded-lg px-4 py-3 backdrop-blur-sm z-10">
          <p className="text-xs font-bold text-white">{tooltip.flag} {tooltip.ip}</p>
          <p className="text-[11px] text-kavach-muted mt-1">{tooltip.count} attacks · {tooltip.location}</p>
          <p className="text-[10px] mt-1">
            <span className={`px-1.5 py-0.5 rounded font-bold ${
              tooltip.severity === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
              tooltip.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>{tooltip.severity}</span>
          </p>
        </div>
      )}
      {hoveredCountry && !tooltip && (
        <div className="absolute pointer-events-none bg-[#111827]/90 border border-white/[0.12] rounded-md px-3 py-1.5 backdrop-blur-sm z-20"
          style={{ left: mousePos.x + 12, top: mousePos.y - 30 }}>
          <p className="text-[11px] font-semibold text-white whitespace-nowrap">{hoveredCountry}</p>
        </div>
      )}
    </>
  );

  const legend = (
    <div className="flex items-center gap-5 mt-3 justify-center">
      {[
        { color: 'bg-pink-500', label: 'Critical' },
        { color: 'bg-red-500', label: 'High' },
        { color: 'bg-amber-500', label: 'Medium' },
        { color: 'bg-blue-500', label: 'Server' },
      ].map(l => (
        <div key={l.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
          <span className="text-[10px] text-kavach-muted">{l.label}</span>
        </div>
      ))}
    </div>
  );

  const expandBtn = (
    <button onClick={() => setExpanded(!expanded)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-kavach-muted hover:text-white hover:bg-white/[0.08] transition-all">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {expanded
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        }
      </svg>
      {expanded ? 'Collapse' : 'Expand'}
    </button>
  );

  return (
    <div className={expanded ? 'fixed inset-0 z-[100] p-4' : ''}>
      <div className={`glass-card p-5 ${expanded ? 'h-full flex flex-col' : ''}`} style={expanded ? { background: '#0b1120' } : {}}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className={`font-semibold text-white ${expanded ? 'text-lg' : 'text-sm'}`}>Live Attack Map</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-kavach-muted px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              {markers.length} active sources
            </span>
            {expandBtn}
          </div>
        </div>
        <div className={`relative rounded-lg overflow-hidden ${expanded ? 'flex-1' : ''}`} style={{ background: '#0d1320' }} onMouseMove={handleMouseMove}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={expanded ? { scale: 180, center: [20, 15] } : { scale: 130, center: [30, 20] }}
            style={{ width: '100%', height: expanded ? '100%' : 'auto' }}
            width={800}
            height={expanded ? 600 : 400}
          >
            {renderMapContent(expanded)}
          </ComposableMap>
          {renderTooltips()}
        </div>
        {legend}
      </div>
    </div>
  );
}
