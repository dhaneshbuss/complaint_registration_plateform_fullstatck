'use client';

import React, { use, useMemo, useState } from 'react';
import { useAuth, Complaint } from '@/lib/contexts/AuthContext';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Activity,
  Award
} from 'lucide-react';
import Link from 'next/link';

export default function CaseDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const { 
    complaints, 
    allOfficers, 
    auditLogs, 
    currentOfficer, 
    updateComplaintStatus, 
    assignComplaint 
  } = useAuth();

  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // Retrieve case
  const complaint = useMemo(() => {
    return complaints.find(c => c.id === id);
  }, [complaints, id]);

  // Retrieve localized audits for this case
  const caseAudits = useMemo(() => {
    if (!complaint) return [];
    return auditLogs.filter(log => log.details?.complaint_number === complaint.complaint_number);
  }, [auditLogs, complaint]);

  if (!complaint) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/complaints" className="text-xs font-mono text-primary-cyber flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" /> BACK TO LEDGER
        </Link>
        <div className="cyber-panel p-8 rounded-lg border border-accent-red/30 text-center text-accent-red font-mono text-xs">
          CRITICAL ERROR: RECORD FOR CASE [{id}] NOT FOUND IN POLICE ARCHIVES.
        </div>
      </div>
    );
  }

  // Handle status update
  const handleStatusChange = async (newStatus: Complaint['status']) => {
    setStatusLoading(true);
    try {
      await updateComplaintStatus(complaint.id, newStatus);
    } catch (e: any) {
      alert('Failed to update status: ' + e.message);
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle officer change
  const handleOfficerChange = async (officerId: string) => {
    setAssignLoading(true);
    try {
      await assignComplaint(complaint.id, officerId);
    } catch (e: any) {
      alert('Failed to reassign officer: ' + e.message);
    } finally {
      setAssignLoading(false);
    }
  };

  // Status badge styling helper
  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Pending': return 'text-accent-red border-accent-red/30 bg-accent-red/5';
      case 'Under Investigation': return 'text-accent-gold border-accent-gold/30 bg-accent-gold/5';
      case 'In Progress': return 'text-primary-cyber border-primary-cyber/30 bg-primary-cyber/5';
      case 'Resolved': return 'text-accent-green border-accent-green/30 bg-accent-green/5';
      case 'Escalated': return 'text-accent-red border-accent-red/50 bg-accent-red/20 animate-pulse';
      case 'Closed': return 'text-slate-400 border-slate-500/30 bg-slate-500/5';
      default: return 'text-slate-400 border-slate-700 bg-slate-800';
    }
  };

  // Find assigned officer details
  const currentAssigned = allOfficers.find(o => o.id === complaint.assigned_officer_id);

  return (
    <div className="space-y-6">
      
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard/complaints"
            className="p-1.5 bg-[#0b1428] border border-border-cyber/30 text-primary-cyber hover:bg-primary-cyber hover:text-slate-950 rounded transition-all shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-orbitron tracking-wider">{complaint.complaint_number}</h2>
              <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold uppercase ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
              <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold uppercase ${
                complaint.priority === 'Critical'
                  ? 'border-accent-red/50 bg-accent-red/20 text-accent-red animate-pulse'
                  : complaint.priority === 'High'
                  ? 'border-accent-red/30 bg-accent-red/10 text-accent-red'
                  : complaint.priority === 'Medium'
                  ? 'border-accent-gold/30 bg-accent-gold/10 text-accent-gold'
                  : 'border-accent-green/30 bg-accent-green/10 text-accent-green'
              }`}>
                {complaint.priority || 'Medium'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">CASE HISTORY & AI REPORT VERIFICATION SCREEN</p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500 bg-[#090e21] border border-slate-900 p-2 rounded max-w-xs self-start sm:self-auto">
          RECORD TIMESTAMP: <span className="text-slate-300">{new Date(complaint.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incident Details & Complainant: Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Incident statement */}
          <div className="cyber-panel rounded-lg p-6 border border-border-cyber/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-primary-cyber font-bold border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              CASE STATEMENT & INCIDENT REPORT
            </h3>
            
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/30 p-4 border border-slate-900 rounded">
                <div className="flex items-center space-x-2 text-slate-400">
                  <MapPin className="w-4 h-4 text-primary-cyber" />
                  <span>DISTRICT: <strong className="text-white uppercase">{complaint.district}</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Activity className="w-4 h-4 text-primary-cyber" />
                  <span>STATION: <strong className="text-white uppercase">{complaint.station}</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400 sm:col-span-2">
                  <Award className="w-4 h-4 text-primary-cyber" />
                  <span>CATEGORY: <strong className="text-white uppercase">{complaint.category}</strong></span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">RAW INCIDENT INCIDENT STATEMENT</span>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#060a17]/80 p-4 border border-slate-900 rounded whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>
            </div>
          </div>

          {/* Complainant Profile card */}
          <div className="cyber-panel rounded-lg p-6 border border-border-cyber/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              COMPLAINANT DEMOGRAPHIC DOSSIER
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3 bg-slate-950/40 rounded border border-slate-900">
                <div className="text-[9px] text-slate-500 uppercase">FULL NAME</div>
                <div className="text-white font-bold mt-1 uppercase">{complaint.complainant_name}</div>
              </div>

              <div className="p-3 bg-slate-950/40 rounded border border-slate-900">
                <div className="text-[9px] text-slate-500 uppercase">CONTACT MOBILE</div>
                <div className="text-white font-bold mt-1">{complaint.complainant_phone}</div>
              </div>

              <div className="p-3 bg-slate-950/40 rounded border border-slate-900">
                <div className="text-[9px] text-slate-500 uppercase">EMAIL ADDRESS</div>
                <div className="text-white font-bold mt-1 truncate">{complaint.complainant_email || 'NOT SUPPLIED'}</div>
              </div>
            </div>
          </div>

          {/* AI Recommended Checklist */}
          <div className="cyber-panel rounded-lg p-6 border border-border-cyber/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-primary-cyber font-bold border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              AI INVESTIGATION GUIDELINE & CHECKS
            </h3>

            <div className="space-y-3 font-mono">
              <div className="p-3.5 bg-slate-950/70 border border-slate-900 rounded-lg flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-1 bg-primary-cyber/15 border border-primary-cyber/30 rounded text-primary-cyber font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Predicted Class Recommendation</div>
                  <p className="mt-1">{complaint.ai_recommended_action || 'Review incident statement and secure evidence.'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-900 rounded-lg flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-1 bg-accent-gold/15 border border-accent-gold/30 rounded text-accent-gold font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Standard Operations Procedure (SOP)</div>
                  <p className="mt-1">
                    {complaint.category === 'Cyber Crime' && 'Coordinate immediately with the District Cyber Response Unit. Secure IP addresses and request transaction logs.'}
                    {complaint.category === 'Women Safety' && 'Assign to Local Women Patrolling Unit (1090). Ensure immediate safety checks and review active local cameras.'}
                    {complaint.category === 'Child Safety' && 'Trigger district-wide missing search guidelines. Check local railway terminals and broadcast descriptions.'}
                    {complaint.category === 'Land Dispute' && 'Instruct Circle Officer to review revenue filings. Warn parties against boundary encroachment.'}
                    {complaint.category === 'Financial Fraud' && 'Direct block/freeze notices to suspect bank branches. Collect transaction UPI details.'}
                    {complaint.category === 'Law & Order' && 'Increase patrols at locality, take precautionary arrests if peace is threatened.'}
                    {complaint.category === 'Missing Person' && 'Register missing dossier, check shelter homes, and circulate photo to adjoining states.'}
                    {complaint.category === 'Domestic Violence' && 'Establish counseling and protection access immediately. Record medical certificates if available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Status updates, assignment & case timeline: Right 1 col */}
        <div className="space-y-6">
          
          {/* Command controls */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2.5">
              Command Station Controls
            </h3>

            {/* Change status */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-slate-500">UPDATE INCIDENT STATUS</label>
              <div className="relative">
                <select
                  disabled={statusLoading}
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(e.target.value as Complaint['status'])}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-slate-200"
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated (CO Review)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Change assignment */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-slate-500">ASSIGN INVESTIGATION OFFICER</label>
              <div className="relative">
                <select
                  disabled={assignLoading}
                  value={complaint.assigned_officer_id || ''}
                  onChange={(e) => handleOfficerChange(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-slate-200"
                >
                  <option value="">-- UNASSIGNED --</option>
                  {allOfficers
                    .filter(o => o.district === complaint.district) // Match same district
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.full_name} ({o.role} - {o.badge_number})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded border border-slate-900 space-y-1 font-mono text-[9px] text-slate-500">
              <div>ASSIGNED STATION: <span className="text-slate-300 font-bold uppercase">{complaint.station}</span></div>
              <div>INVESTIGATION LEADER: <span className="text-slate-300 font-bold uppercase">{currentAssigned?.full_name || 'AWAITING ASSIGNMENT'}</span></div>
            </div>
          </div>

          {/* AI Metrics card */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2.5 flex items-center justify-between">
              <span>AI ASSESSMENT SCORES</span>
              <Cpu className="w-3.5 h-3.5 text-primary-cyber animate-pulse" />
            </h3>

            <div className="space-y-3.5 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase text-[10px]">Predicted Cat</span>
                <span className="text-white font-bold uppercase">{complaint.ai_predicted_category || complaint.category}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase text-[10px]">Severity Rank</span>
                <span className={`font-black ${
                  complaint.ai_severity_score >= 8 
                    ? 'text-accent-red' 
                    : complaint.ai_severity_score >= 5 
                    ? 'text-accent-gold' 
                    : 'text-accent-green'
                }`}>{complaint.ai_severity_score} / 10</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase text-[10px]">Priority Level</span>
                <span className={`font-bold ${
                  complaint.priority === 'Critical' || complaint.priority === 'High'
                    ? 'text-accent-red'
                    : complaint.priority === 'Medium'
                    ? 'text-accent-gold'
                    : 'text-accent-green'
                }`}>{complaint.priority || 'Medium'}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase text-[10px]">Action Escalation</span>
                <span className="text-white">{complaint.ai_severity_score >= 8 ? 'CRITICAL FORCE' : 'ROUTINE STAGING'}</span>
              </div>
            </div>
          </div>

          {/* Timeline of events (case logs) */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              CASE SYSTEM TIMELINE LOGS
            </h3>

            {caseAudits.length === 0 ? (
              <div className="text-center py-4 text-[10px] font-mono text-slate-600 uppercase">
                NO AUDITED ACTIONS DETECTED FOR CASE
              </div>
            ) : (
              <div className="space-y-3 font-mono text-[10px]">
                {caseAudits.map(log => (
                  <div key={log.id} className="border-l border-slate-800 pl-3 py-0.5 relative space-y-0.5">
                    <div className="absolute top-1 left-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-cyber/40 border border-primary-cyber"></div>
                    <div className="flex justify-between text-slate-500">
                      <span className="font-bold text-slate-400">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-slate-300">
                      {log.action === 'CREATE_COMPLAINT' && 'Case registered on the electronic ledger.'}
                      {log.action === 'UPDATE_STATUS' && `Investigation status updated to [${log.details?.status}].`}
                      {log.action === 'ASSIGN_CASE' && `Case investigation reassigned to ${log.details?.assigned_to}.`}
                    </div>
                    <div className="text-slate-500 text-[8px]">
                      BY: {log.officer_name} ({log.officer_badge})
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
