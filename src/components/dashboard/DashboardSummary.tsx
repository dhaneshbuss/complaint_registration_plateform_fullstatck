'use client';

import React from 'react';
import { Complaint } from '@/lib/contexts/AuthContext';
import { FileText, AlertCircle, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SummaryProps {
  data: Complaint[];
  escalatedCount: number;
  isStateScope: boolean;
}

export const DashboardSummary: React.FC<SummaryProps> = ({ data, escalatedCount, isStateScope }) => {
  const total = data.length;
  const pending = data.filter(c => c.status === 'Pending').length;
  const investigating = data.filter(c => c.status === 'Under Investigation' || c.status === 'In Progress').length;
  const resolved = data.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const disposalRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const cards = [
    {
      title: 'Active Caseload',
      value: total,
      subtext: isStateScope ? 'STATEWIDE CHANNELS' : 'LOCAL JURISDICTION RECORD',
      icon: FileText,
      glow: 'cyber-glow-blue',
      textColor: 'text-primary-cyber'
    },
    {
      title: 'Awaiting Dispatch',
      value: pending,
      subtext: isStateScope ? 'STATEWIDE DISPATCH' : 'LOCAL STATION DISPATCH',
      icon: AlertCircle,
      glow: 'cyber-glow-red',
      textColor: 'text-accent-red'
    },
    {
      title: 'Active Inquiries',
      value: investigating,
      subtext: 'INVESTIGATION UNIT ACTIVE',
      icon: Eye,
      glow: 'cyber-glow-gold',
      textColor: 'text-accent-gold'
    },
    {
      title: 'Resolved Cases',
      value: resolved,
      subtext: 'DISPOSED & CLOSED FILES',
      icon: CheckCircle2,
      glow: 'cyber-glow-green',
      textColor: 'text-accent-green'
    },
    {
      title: 'Disposal Rate',
      value: `${disposalRate}%`,
      subtext: 'RESOLUTION EFFICIENCY',
      icon: ShieldAlert,
      glow: 'cyber-glow-blue',
      textColor: 'text-primary-cyber'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className={`cyber-panel rounded-lg p-4 flex flex-col justify-between border relative overflow-hidden transition-all hover:scale-[1.02] ${card.glow}`}
          >
            {/* Background scanner line effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full -mr-6 -mt-6"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.textColor} opacity-80`} />
            </div>

            <div className="mt-4">
              <span className={`text-2xl md:text-3xl font-black font-orbitron ${card.textColor}`}>{card.value}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>{card.subtext}</span>
              {card.title === 'Awaiting Dispatch' && escalatedCount > 0 && (
                <span className="text-accent-red font-bold animate-pulse">({escalatedCount} ESCALATED)</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
