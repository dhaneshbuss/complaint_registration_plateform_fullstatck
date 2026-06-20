'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ScrollText, ShieldAlert, Search, Filter, Terminal, Calendar } from 'lucide-react';

export default function AuditLogsPage() {
  const { currentOfficer, auditLogs, loading } = useAuth();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  // Enforce access control: Restricted to SP and DGP
  const isAuthorized = useMemo(() => {
    if (!currentOfficer) return false;
    return ['DGP', 'SP'].includes(currentOfficer.role);
  }, [currentOfficer]);

  // Unique list of action categories for filters
  const actionsList = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(log => set.add(log.action));
    return ['All', ...Array.from(set)];
  }, [auditLogs]);

  // Apply search query and action category filters
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = query === '' || 
        log.officer_name.toLowerCase().includes(query) ||
        log.officer_badge.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        JSON.stringify(log.details).toLowerCase().includes(query);

      const matchAction = selectedAction === 'All' || log.action === selectedAction;

      return matchSearch && matchAction;
    });
  }, [auditLogs, searchTerm, selectedAction]);

  if (loading || !currentOfficer) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary-cyber border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500">DECRYPTING SECURITY AUDITS...</p>
        </div>
      </div>
    );
  }

  // Block unauthorized officers
  if (!isAuthorized) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="max-w-md w-full cyber-panel border border-accent-red/40 rounded-lg p-8 text-center space-y-5 shadow-[0_0_30px_rgba(255,62,62,0.1)] scanline">
          <div className="inline-flex p-4 bg-accent-red/10 border border-accent-red/30 rounded-full animate-pulse">
            <ShieldAlert className="w-10 h-10 text-accent-red" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white font-orbitron tracking-widest uppercase">ACCESS DENIED</h2>
            <p className="text-xs text-accent-red uppercase font-mono tracking-wider">ERROR 403: PRIVILEGE ESCALATION BLOCK</p>
          </div>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Your current credential clearance level (<strong className="text-white">{currentOfficer.role}</strong>) does not grant access to system-wide audit logs. Only circle command (SP) or headquarters (DGP) can view security ledgers.
          </p>
          <div className="text-[9px] font-mono text-slate-500 pt-3 border-t border-slate-900">
            JURISDICTION ENFORCED BY ROW LEVEL SECURITY (RLS) POLICIES
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-orbitron tracking-wider flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary-cyber" />
            SECURITY LEDGER & AUDITS
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">CHRONOLOGICAL RECORD OF CRITICAL POLICE STATISTICAL OPERATIONS</p>
        </div>
        <div className="p-1.5 px-3 bg-accent-red/10 border border-accent-red/30 rounded font-mono text-[10px] text-accent-red uppercase flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldAlert className="w-4 h-4 text-accent-red" />
          <span>SECURITY LEVEL: RESTRICTED</span>
        </div>
      </div>

      {/* Filter controls */}
      <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold border-b border-slate-900 pb-2.5">
          <Filter className="w-3.5 h-3.5 text-primary-cyber" />
          <span>LEDGER SEARCH ENGINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-slate-400">QUERY OPERATOR NAME / BADGE / METADATA</label>
            <div className="relative">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search badge, operator..."
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Action type */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-slate-400">ACTION TYPE</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-slate-200 transition-all"
            >
              {actionsList.map(act => (
                <option key={act} value={act} className="bg-slate-950 text-white">{act}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs list table */}
      <div className="cyber-panel rounded-lg border border-border-cyber/30 overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#0b132a] border-b border-border-cyber/30 text-slate-400">
                <th className="p-4 uppercase tracking-wider text-[10px] w-48">Timestamp</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Officer Operator</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Action Trigger</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">IPv4 Network Address</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Metadata Details (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-slate-950/25">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs font-mono">
                    NO COMPLIANCE AUDITS CAPTURED IN STAGING SYSTEM
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-4 text-slate-400 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-200 font-bold">
                      <div className="font-semibold">{log.officer_name}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">BADGE: {log.officer_badge}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        log.action === 'LOGIN' 
                          ? 'border-accent-green/20 bg-accent-green/5 text-accent-green' 
                          : log.action === 'CREATE_COMPLAINT' 
                          ? 'border-primary-cyber/20 bg-primary-cyber/5 text-primary-cyber' 
                          : 'border-accent-gold/20 bg-accent-gold/5 text-accent-gold'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="bg-slate-950/80 p-2 border border-slate-900 rounded font-mono text-[10px] text-accent-green overflow-x-auto whitespace-nowrap">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
