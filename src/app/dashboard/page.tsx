'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { 
  ShieldAlert, 
  RefreshCw, 
  TrendingUp, 
  ArrowRight, 
  UserCheck, 
  Play, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { 
    currentOfficer, 
    complaints, 
    allOfficers, 
    loading, 
    refreshData, 
    assignComplaint, 
    updateComplaintStatus 
  } = useAuth();

  const [isStateScope, setIsStateScope] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [dispatchLoading, setDispatchLoading] = useState<Record<string, boolean>>({});

  // Scoped complaints based on officer rank
  const localComplaints = useMemo(() => {
    if (!currentOfficer) return [];
    
    switch (currentOfficer.role) {
      case 'SHO':
        return complaints.filter(
          c => c.station === currentOfficer.station && c.district === currentOfficer.district
        );
      case 'CO':
      case 'SP':
        return complaints.filter(c => c.district === currentOfficer.district);
      case 'DGP':
      default:
        return complaints;
    }
  }, [complaints, currentOfficer]);

  // Select active data scope
  const activeComplaints = isStateScope ? complaints : localComplaints;

  // Critical alerts list (severity >= 8 and not resolved)
  const criticalAlerts = useMemo(() => {
    return activeComplaints
      .filter(c => c.ai_severity_score >= 8 && c.status !== 'Resolved')
      .sort((a, b) => b.ai_severity_score - a.ai_severity_score)
      .slice(0, 5);
  }, [activeComplaints]);

  // Escalated count for display
  const escalatedCount = useMemo(() => {
    return activeComplaints.filter(c => c.status === 'Escalated').length;
  }, [activeComplaints]);

  // Recent activity simulation feeds based on active scope
  const recentActivities = useMemo(() => {
    return activeComplaints
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [activeComplaints]);

  // Pending complaints list for dispatch widget
  const pendingComplaints = useMemo(() => {
    return activeComplaints
      .filter(c => c.status === 'Pending')
      .sort((a, b) => b.ai_severity_score - a.ai_severity_score)
      .slice(0, 5);
  }, [activeComplaints]);

  // Handle rapid officer assignment from dashboard
  const handleAssignOfficer = async (complaintId: string, officerId: string) => {
    setDispatchLoading(prev => ({ ...prev, [complaintId]: true }));
    try {
      await assignComplaint(complaintId, officerId);
    } catch (e: any) {
      alert('Failed to assign officer: ' + e.message);
    } finally {
      setDispatchLoading(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  // One-click to launch/investigate case from dashboard
  const handleLaunchInvestigation = async (complaintId: string) => {
    setDispatchLoading(prev => ({ ...prev, [complaintId]: true }));
    try {
      await updateComplaintStatus(complaintId, 'Under Investigation');
    } catch (e: any) {
      alert('Failed to launch investigation: ' + e.message);
    } finally {
      setDispatchLoading(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  if (loading || !currentOfficer) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary-cyber border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500">AGGREGATING THREAT INTELLIGENCE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-orbitron tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-cyber" />
            POLICE OPERATIONS COMMAND CENTER
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            OPERATOR: <span className="text-white font-semibold">{currentOfficer.full_name}</span> // 
            SCOPED UNIT: <span className="text-accent-gold font-bold">{currentOfficer.role} ({currentOfficer.role === 'DGP' ? 'Statewide Command' : currentOfficer.district})</span>
          </p>
        </div>
        
        {/* Actions panel */}
        <div className="flex items-center space-x-3">
          {/* Scope Toggle Header */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-900 rounded p-1 font-mono text-[9px]">
            <button
              onClick={() => setIsStateScope(true)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                isStateScope ? 'bg-primary-cyber text-slate-950 font-bold' : 'text-slate-500 hover:text-white'
              }`}
            >
              STATE SCOPE
            </button>
            <button
              onClick={() => setIsStateScope(false)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                !isStateScope ? 'bg-accent-gold text-slate-950 font-bold' : 'text-slate-500 hover:text-white'
              }`}
            >
              LOCAL SCOPE
            </button>
          </div>

          <button 
            onClick={refreshData}
            className="flex items-center space-x-2 bg-slate-900/60 hover:bg-slate-950 border border-slate-800 hover:border-primary-cyber/40 px-3 py-1.5 rounded text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SYNC DATA</span>
          </button>
          
          <Link 
            href="/dashboard/complaints/new"
            className="flex items-center space-x-2 bg-primary-cyber hover:bg-primary-cyber/95 border border-transparent px-3 py-1.5 rounded text-xs font-mono font-bold text-slate-950 transition-all shadow-[0_0_10px_rgba(0,210,255,0.1)] text-center shrink-0"
          >
            <span>NEW FILE</span>
          </Link>
        </div>
      </div>

      {/* Metric summary with dynamic scope bind */}
      <DashboardSummary 
        data={activeComplaints} 
        escalatedCount={escalatedCount} 
        isStateScope={isStateScope}
      />

      {/* Main Grid: Charts & Command Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts and Heatmaps: left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <AnalyticsCharts data={activeComplaints} />
        </div>

        {/* Action Widgets panel: right 1 column */}
        <div className="space-y-6">
          
          {/* High Risk Alert Monitor */}
          <div className="cyber-panel rounded-lg p-5 border border-accent-red/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-accent-red font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 animate-pulse text-accent-red" />
                HIGH RISK OPERATIONS TELEMETRY
              </h3>
              {/* Fake Audio alert toggle */}
              <button 
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
                title={isAudioMuted ? "Unmute Alarm" : "Mute Alarm"}
              >
                {isAudioMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-accent-red animate-bounce" />}
              </button>
            </div>
            
            {criticalAlerts.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded text-center text-xs font-mono text-slate-500">
                NO CRITICAL OFFENSE THREATS DETECTED
              </div>
            ) : (
              <div className="space-y-3">
                {criticalAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className="p-3 bg-accent-red-glow/5 border border-accent-red/20 rounded flex justify-between items-center hover:border-accent-red/40 transition-colors"
                  >
                    <div className="space-y-1 pr-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{alert.complaint_number}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-accent-red/10 border border-accent-red/30 rounded text-accent-red font-mono font-bold shrink-0">
                          SEV: {alert.ai_severity_score}
                        </span>
                        <span className="text-[9px] px-1 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded font-mono uppercase shrink-0">
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium truncate">{alert.description}</p>
                      <div className="text-[9px] font-mono text-slate-500 uppercase truncate">
                        {alert.category} // {alert.station}
                      </div>
                    </div>
                    <Link 
                      href={`/dashboard/complaints/${alert.id}`}
                      className="p-1.5 bg-slate-900 border border-slate-800 hover:border-accent-red/40 hover:text-accent-red rounded transition-all shrink-0 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable Pending Dispatch Widget */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30">
            <h3 className="text-xs font-mono uppercase tracking-wider text-accent-gold font-bold border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent-gold" />
              AWAITING DISPATCH / REVIEW
            </h3>

            {pendingComplaints.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded text-center text-xs font-mono text-slate-500">
                NO CASE DISPATCH PENDING
              </div>
            ) : (
              <div className="space-y-4 font-mono text-[10px]">
                {pendingComplaints.map(comp => (
                  <div key={comp.id} className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-2.5">
                    <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold">{comp.complaint_number}</span>
                        <span className="text-[8px] px-1 bg-accent-gold/15 border border-accent-gold/30 text-accent-gold rounded">
                          PENDING
                        </span>
                      </div>
                      <span className="text-slate-500 text-[8px]">{comp.station}</span>
                    </div>

                    <p className="text-slate-300 text-[10px] line-clamp-1 leading-relaxed">{comp.description}</p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Assign dropdown */}
                      <select
                        disabled={dispatchLoading[comp.id]}
                        value={comp.assigned_officer_id || ''}
                        onChange={(e) => handleAssignOfficer(comp.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 hover:border-primary-cyber/40 focus:outline-none rounded p-1 text-[9px] text-slate-300 transition-all font-mono"
                      >
                        <option value="">-- ASSIGN --</option>
                        {allOfficers
                          .filter(o => o.district === comp.district)
                          .map(o => (
                            <option key={o.id} value={o.id}>
                              {o.full_name} ({o.role})
                            </option>
                          ))}
                      </select>

                      {/* Launch investigation button */}
                      <button
                        type="button"
                        disabled={dispatchLoading[comp.id]}
                        onClick={() => handleLaunchInvestigation(comp.id)}
                        className="bg-slate-900 hover:bg-primary-cyber border border-slate-800 hover:border-transparent text-primary-cyber hover:text-slate-950 rounded py-1 px-2 font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>DISPATCH</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Incident Stream */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between border-b border-slate-900 pb-3">
              <span>LIVE INCIDENT STREAM</span>
              <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></span>
            </h3>

            {recentActivities.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded text-center text-xs font-mono text-slate-500">
                AWAITING INCOMING TELEMETRY
              </div>
            ) : (
              <div className="space-y-4 font-mono">
                {recentActivities.map((act, idx) => (
                  <div key={act.id} className="text-[10px] border-l border-slate-800 pl-3.5 py-0.5 relative space-y-1">
                    {/* Tick node */}
                    <div className="absolute top-1 left-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-cyber/40 border border-primary-cyber"></div>
                    
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{act.complaint_number}</span>
                      <span>{new Date(act.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                    </div>
                    <div className="text-slate-300 line-clamp-1">
                      New {act.category} filed by complainant {act.complainant_name}.
                    </div>
                    <div className="text-slate-500 uppercase">
                      STATION: <span className="text-primary-cyber">{act.station}</span> // STATUS: <span className="text-white">{act.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
