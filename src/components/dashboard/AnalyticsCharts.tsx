'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Complaint } from '@/lib/contexts/AuthContext';
import { Shield, Activity, Grid } from 'lucide-react';

interface ChartsProps {
  data: Complaint[];
}

export const AnalyticsCharts: React.FC<ChartsProps> = ({ data }) => {
  const districts = Array.from(new Set(data.map(c => c.district))).filter(Boolean).sort();
  const categories = [
    'Cyber Crime',
    'Women Safety',
    'Child Safety',
    'Land Dispute',
    'Financial Fraud',
    'Law & Order',
    'Missing Person',
    'Domestic Violence'
  ];

  // 1. Process Category Data
  const categoriesMap: Record<string, number> = {};
  data.forEach(c => {
    categoriesMap[c.category] = (categoriesMap[c.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoriesMap).map(cat => ({
    name: cat,
    cases: categoriesMap[cat],
  })).sort((a, b) => b.cases - a.cases);

  // 2. Process District Data
  const districtsMap: Record<string, number> = {};
  data.forEach(c => {
    districtsMap[c.district] = (districtsMap[c.district] || 0) + 1;
  });
  const districtData = districts.map(dist => ({
    name: dist,
    value: districtsMap[dist] || 0,
  })).filter(d => d.value > 0);

  // 3. Process Date/Trend Data (last 7 days of registrations)
  const dateMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateMap[dateStr] = 0;
  }
  data.forEach(c => {
    const cDate = new Date(c.created_at);
    const dateStr = cDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dateStr in dateMap) {
      dateMap[dateStr]++;
    }
  });
  const trendData = Object.keys(dateMap).map(date => ({
    date,
    complaints: dateMap[date],
  }));

  // Colors
  const COLORS = ['#00d2ff', '#10b981', '#f59e0b', '#ff3e3e', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

  const customTooltipStyle = {
    contentStyle: { 
      backgroundColor: 'rgba(6, 10, 23, 0.95)', 
      border: '1px solid rgba(0, 210, 255, 0.25)', 
      borderRadius: '4px',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '11px'
    },
    itemStyle: { color: '#00d2ff' }
  };

  // Heatmap rendering helpers
  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-950/40 text-slate-700 border-slate-900/50';
    if (count <= 2) return 'bg-cyan-950/30 text-cyan-400 border-cyan-500/20 shadow-[inset_0_0_4px_rgba(6,182,212,0.1)]';
    if (count <= 4) return 'bg-amber-950/30 text-amber-400 border-amber-500/30 shadow-[inset_0_0_6px_rgba(245,158,11,0.15)]';
    return 'bg-accent-red-glow/20 text-accent-red border-accent-red/40 shadow-[0_0_8px_rgba(255,62,62,0.15),inset_0_0_8px_rgba(255,62,62,0.15)] animate-pulse font-black';
  };

  return (
    <div className="space-y-6">
      
      {/* Top row: Trends and District Share */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Trends chart (AreaChart with Gradient) */}
        <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 xl:col-span-2 hover:border-primary-cyber/60 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-cyber" />
              7-Day Case Registration Trends
            </span>
            <span className="text-[10px] text-primary-cyber font-bold animate-pulse">● FEED SECURED</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px', fontFamily: 'monospace' }} allowDecimals={false} />
                <Tooltip {...customTooltipStyle} />
                <Area 
                  type="monotone" 
                  dataKey="complaints" 
                  stroke="#00d2ff" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorComplaints)"
                  activeDot={{ r: 5, stroke: '#00d2ff', strokeWidth: 1, fill: '#050814' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District breakdown (Pie) */}
        <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 flex flex-col hover:border-primary-cyber/60 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
            District Operations Share
          </h3>
          <div className="h-64 flex flex-col">
            <div className="h-44 shrink-0">
              {districtData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  NO CASE DATA DETECTED IN ACTIVE LEDGER
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={districtData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {districtData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...customTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono mt-2 pt-2 border-t border-slate-900 overflow-y-auto flex-1 pr-1">
              {districtData.map((d, i) => (
                <div key={d.name} className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-slate-400 uppercase truncate">{d.name}:</span>
                  <span className="text-white font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Heatmap grid mapping Districts against Offenses */}
      <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 hover:border-primary-cyber/60 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300">
        <h3 className="text-xs font-mono uppercase tracking-wider text-primary-cyber font-bold mb-4 flex items-center gap-2">
          <Grid className="w-4 h-4 text-primary-cyber" />
          STATE-WIDE DISTRICT THREAT HEATMAP (OFFENSE INCIDENCE)
        </h3>

        <div className="overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-9 gap-1 font-mono text-[9px]">
            {/* Headers row */}
            <div className="p-2 text-slate-400 font-bold uppercase border-b border-slate-900">District Command</div>
            {categories.map(cat => (
              <div key={cat} className="p-2 text-slate-400 font-bold text-center border-b border-slate-900 truncate" title={cat}>
                {cat}
              </div>
            ))}

            {/* Matrix rows */}
            {districts.map(dist => {
              const activeCount = data.filter(c => c.district === dist).length;
              return (
                <React.Fragment key={dist}>
                  <div className="p-2.5 bg-slate-950 border border-slate-900/60 text-slate-300 font-bold flex justify-between items-center uppercase">
                    <span>{dist}</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded font-normal">{activeCount} total</span>
                  </div>
                  {categories.map(cat => {
                    const count = data.filter(c => c.district === dist && c.category === cat).length;
                    return (
                      <div 
                        key={cat} 
                        className={`p-2.5 text-center border rounded transition-all duration-300 hover:scale-110 hover:z-10 relative cursor-crosshair hover:shadow-[0_0_15px_rgba(0,210,255,0.4)] ${getHeatmapColorClass(count)}`}
                        title={`${dist} - ${cat}: ${count} cases`}
                      >
                        {count}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Heatmap Legend */}
        <div className="flex items-center space-x-6 mt-4 pt-3 border-t border-slate-900 text-[8px] font-mono text-slate-500">
          <span className="uppercase">HEAT INDEX:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-950/40 border border-slate-900 rounded"></span>
            <span>0 CASES (CLEAR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded"></span>
            <span>1-2 CASES (LOW CONCENTRATION)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-950/30 border border-amber-500/30 rounded"></span>
            <span>3-4 CASES (ELEVATED INCIDENCE)</span>
          </div>
          <div className="flex items-center gap-1.5 animate-pulse">
            <span className="w-2.5 h-2.5 bg-accent-red-glow/20 border border-accent-red/40 rounded"></span>
            <span className="text-accent-red font-bold">5+ CASES (CRITICAL UNIT THREAT)</span>
          </div>
        </div>
      </div>

      {/* Row 3: Categories Chart & District CASERATIO List */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Categories Bar Chart */}
        <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 xl:col-span-2 hover:border-primary-cyber/60 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
            Offense Classification Breakdown
          </h3>
          <div className="h-64">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                NO CATEGORY METRICS DETECTED
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px', fontFamily: 'monospace' }} allowDecimals={false} />
                  <Tooltip {...customTooltipStyle} />
                  <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* District CASERATIO List */}
        <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 flex flex-col justify-between hover:border-primary-cyber/60 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-400" />
              District Operational Status
            </h3>
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed mb-4">
              Real-time reporting ledger of registered complaint metrics across active UP districts.
            </p>
          </div>

          <div className="space-y-2.5 font-mono text-[10px] flex-1 overflow-y-auto pr-1">
            {districts.map((dist) => {
              const activeCount = data.filter(c => c.district === dist && c.status !== 'Resolved').length;
              const resolvedCount = data.filter(c => c.district === dist && c.status === 'Resolved').length;
              const ratio = (activeCount + resolvedCount) > 0 
                ? Math.round((resolvedCount / (activeCount + resolvedCount)) * 100) 
                : 100;
              return (
                <div key={dist} className="p-2.5 bg-slate-950/60 border border-slate-900 rounded flex items-center justify-between">
                  <span className="text-white font-bold uppercase">{dist}</span>
                  <div className="flex items-center space-x-3 text-right">
                    <span className="text-slate-400">ACTIVE: <strong className="text-accent-gold">{activeCount}</strong></span>
                    <span className="text-slate-400">RATIO: <strong className="text-primary-cyber">{ratio}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
