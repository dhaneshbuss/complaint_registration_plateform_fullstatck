'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Shield, Clock, Database, ChevronDown, Zap, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentOfficer, switchRole, isLiveDb } = useAuth();
  const [time, setTime] = useState<string>('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentOfficer) return null;

  const roles: ('SHO' | 'CO' | 'SP' | 'DGP')[] = ['SHO', 'CO', 'SP', 'DGP'];

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'DGP': return 'Director General (DGP)';
      case 'SP': return 'Superintendent (SP)';
      case 'CO': return 'Circle Officer (CO)';
      case 'SHO': return 'Station House (SHO)';
      default: return r;
    }
  };

  return (
    <header className="h-18 border-b border-border-cyber/50 bg-[#080d1e]/85 backdrop-blur-md px-6 flex items-center justify-between relative z-50">
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-cyber to-transparent opacity-60"></div>
      
      {/* Title / Logo */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary-cyber/10 rounded-md border border-primary-cyber/30 animate-pulse">
          <Shield className="w-6 h-6 text-primary-cyber" />
        </div>
        <div>
          <h1 className="text-md md:text-lg font-bold font-orbitron tracking-wider text-white flex items-center gap-2">
            UP POLICE <span className="text-primary-cyber text-xs border border-primary-cyber/40 px-1.5 py-0.5 rounded font-sans tracking-normal bg-primary-cyber/5">INTEL CENTER</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">SECURE INTELLIGENCE DASHBOARD // DISTRICT COMMAND</p>
        </div>
      </div>

      {/* Real-time details */}
      <div className="hidden lg:flex items-center space-x-6">
        {/* Time */}
        <div className="flex items-center space-x-2 text-slate-300 font-mono text-sm border-r border-slate-800 pr-6">
          <Clock className="w-4 h-4 text-primary-cyber" />
          <span>{time} IST</span>
        </div>

        {/* Database Status */}
        <div className="flex items-center space-x-2 text-xs font-mono border-r border-slate-800 pr-6">
          <Database className="w-3.5 h-3.5 text-primary-cyber" />
          <span className="text-slate-400">DB STATUS:</span>
          {isLiveDb ? (
            <span className="text-accent-green flex items-center gap-1.5 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-ping"></span>
              LIVE SUPABASE
            </span>
          ) : (
            <span className="text-accent-gold flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
              MOCK SANDBOX
            </span>
          )}
        </div>
      </div>

      {/* User settings / Role Switcher */}
      <div className="flex items-center space-x-4">
        {/* Role Quick Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 bg-slate-900/60 hover:bg-slate-900 border border-border-cyber/30 px-3 py-1.5 rounded-md text-xs font-mono text-slate-200 transition-all hover:border-primary-cyber/50 shadow-inner"
          >
            <Zap className="w-3 h-3 text-accent-gold" />
            <span>ROLE: <strong className="text-primary-cyber">{currentOfficer.role}</strong></span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0c152c] border border-border-cyber rounded-md shadow-2xl z-50 overflow-hidden">
              <div className="p-2 border-b border-border-cyber/50 bg-[#070d1e] text-[10px] font-mono text-slate-400">
                SIMULATE DISTRICT ROLES
              </div>
              <div className="py-1">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-mono transition-colors flex items-center justify-between ${
                      currentOfficer.role === r 
                        ? 'bg-primary-cyber/10 text-primary-cyber font-bold' 
                        : 'text-slate-300 hover:bg-slate-950 hover:text-white'
                    }`}
                  >
                    <span>{getRoleLabel(r)}</span>
                    {currentOfficer.role === r && <span className="w-1.5 h-1.5 bg-primary-cyber rounded-full"></span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-white leading-none">{currentOfficer.full_name}</div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">
              {currentOfficer.station} ({currentOfficer.district})
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
