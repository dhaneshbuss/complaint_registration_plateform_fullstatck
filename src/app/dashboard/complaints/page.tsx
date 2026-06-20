'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FolderOpen, Search, Filter, ShieldAlert, Eye, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ComplaintsListPage() {
  const { currentOfficer, complaints, loading } = useAuth();
  
  // Filter and search state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const categories = [
    'All',
    'Cyber Crime',
    'Women Safety',
    'Child Safety',
    'Land Dispute',
    'Financial Fraud',
    'Law & Order',
    'Missing Person',
    'Domestic Violence'
  ];

  const statuses = ['All', 'Pending', 'Under Investigation', 'In Progress', 'Resolved', 'Escalated', 'Closed'];

  // Role-based visibility scoping
  const scopedComplaints = useMemo(() => {
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

  // Combined filters application
  const filteredComplaints = useMemo(() => {
    return scopedComplaints.filter(c => {
      // 1. Search term check
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = query === '' || 
        c.complaint_number.toLowerCase().includes(query) ||
        c.complainant_name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        (c.complainant_phone && c.complainant_phone.includes(query));

      // 2. Category check
      const matchCategory = selectedCategory === 'All' || c.category === selectedCategory;

      // 3. Status check
      const matchStatus = selectedStatus === 'All' || c.status === selectedStatus;

      // 4. Severity check
      let matchSeverity = true;
      if (selectedSeverity !== 'All') {
        const score = c.ai_severity_score;
        if (selectedSeverity === 'High') matchSeverity = score >= 8;
        else if (selectedSeverity === 'Medium') matchSeverity = score >= 5 && score <= 7;
        else if (selectedSeverity === 'Low') matchSeverity = score <= 4;
      }

      // 5. Priority check
      const matchPriority = selectedPriority === 'All' || c.priority === selectedPriority;

      return matchSearch && matchCategory && matchStatus && matchSeverity && matchPriority;
    });
  }, [scopedComplaints, searchTerm, selectedCategory, selectedStatus, selectedSeverity, selectedPriority]);

  // Status tag helper styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 py-0.5 border border-accent-red/30 bg-accent-red/5 text-accent-red font-mono text-[10px] rounded font-bold uppercase">Pending</span>;
      case 'Under Investigation':
        return <span className="px-2 py-0.5 border border-accent-gold/30 bg-accent-gold/5 text-accent-gold font-mono text-[10px] rounded font-bold uppercase">Investigating</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 border border-primary-cyber/30 bg-primary-cyber/5 text-primary-cyber font-mono text-[10px] rounded font-bold uppercase">In Progress</span>;
      case 'Resolved':
        return <span className="px-2 py-0.5 border border-accent-green/30 bg-accent-green/5 text-accent-green font-mono text-[10px] rounded font-bold uppercase">Resolved</span>;
      case 'Escalated':
        return <span className="px-2 py-0.5 border border-accent-red/45 bg-accent-red/20 text-accent-red font-mono text-[10px] rounded font-bold uppercase animate-pulse">Escalated</span>;
      case 'Closed':
        return <span className="px-2 py-0.5 border border-slate-500/30 bg-slate-500/5 text-slate-400 font-mono text-[10px] rounded font-bold uppercase">Closed</span>;
      default:
        return <span className="px-2 py-0.5 border border-slate-700 bg-slate-800 text-slate-400 font-mono text-[10px] rounded font-bold uppercase">{status}</span>;
    }
  };

  // Severity badge helpers
  const getSeverityBadge = (score: number) => {
    if (score >= 8) {
      return <span className="px-1.5 py-0.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded text-[9px] font-mono font-black">{score} / 10</span>;
    } else if (score >= 5) {
      return <span className="px-1.5 py-0.5 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold rounded text-[9px] font-mono font-black">{score} / 10</span>;
    } else {
      return <span className="px-1.5 py-0.5 bg-primary-cyber/10 border border-primary-cyber/30 text-primary-cyber rounded text-[9px] font-mono font-black">{score} / 10</span>;
    }
  };

  // Priority badge helper
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 border border-accent-red/50 bg-accent-red/20 text-accent-red font-mono text-[10px] rounded font-bold uppercase animate-pulse">Critical</span>;
      case 'High':
        return <span className="px-2 py-0.5 border border-accent-red/30 bg-accent-red/5 text-accent-red font-mono text-[10px] rounded font-bold uppercase">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 border border-accent-gold/30 bg-accent-gold/5 text-accent-gold font-mono text-[10px] rounded font-bold uppercase">Medium</span>;
      case 'Low':
        return <span className="px-2 py-0.5 border border-accent-green/30 bg-accent-green/5 text-accent-green font-mono text-[10px] rounded font-bold uppercase">Low</span>;
      default:
        return <span className="px-2 py-0.5 border border-slate-700 bg-slate-800 text-slate-400 font-mono text-[10px] rounded font-bold uppercase">Medium</span>;
    }
  };

  if (loading || !currentOfficer) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary-cyber border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500">OPENING COMPLAINTS ARCHIVES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-orbitron tracking-wider flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-cyber" />
            CASE MANAGEMENT SYSTEM
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            RETRIEVED <span className="text-primary-cyber font-bold">{filteredComplaints.length}</span> / {scopedComplaints.length} COMPLAINTS AT STATION RECORD
          </p>
        </div>

        <Link 
          href="/dashboard/complaints/new"
          className="flex items-center justify-center space-x-2 bg-primary-cyber hover:bg-primary-cyber/95 border border-transparent px-4 py-2 rounded text-xs font-mono font-bold text-slate-950 transition-all shadow-[0_0_10px_rgba(0,210,255,0.1)] self-start md:self-auto"
        >
          <span>FILE NEW INCIDENT</span>
        </Link>
      </div>

      {/* Filter and search bar */}
      <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold border-b border-slate-900 pb-2.5">
          <Filter className="w-3.5 h-3.5 text-primary-cyber" />
          <span>FILTER CONTROLS TERMINAL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Search Term */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-400">SEARCH CASE / PHONE / NAME</label>
            <div className="relative">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Query query..."
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-400">OFFENSE CLASSIFICATION</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-slate-200 transition-all"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-400">INVESTIGATION STATUS</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-slate-200 transition-all"
            >
              {statuses.map(st => (
                <option key={st} value={st} className="bg-slate-950 text-white">{st}</option>
              ))}
            </select>
          </div>

          {/* Severity filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-400">AI SEVERITY INDEX</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-slate-200 transition-all"
            >
              <option value="All" className="bg-slate-950 text-white">All Threat Levels</option>
              <option value="High" className="bg-slate-950 text-white">Critical / High (8-10)</option>
              <option value="Medium" className="bg-slate-950 text-white">Medium (5-7)</option>
              <option value="Low" className="bg-slate-950 text-white">Low Severity (1-4)</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-400">PRIORITY SCORING</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-slate-200 transition-all"
            >
              <option value="All" className="bg-slate-950 text-white">All Priorities</option>
              <option value="Critical" className="bg-slate-950 text-white">Critical</option>
              <option value="High" className="bg-slate-950 text-white">High</option>
              <option value="Medium" className="bg-slate-950 text-white">Medium</option>
              <option value="Low" className="bg-slate-950 text-white">Low</option>
            </select>
          </div>

        </div>
      </div>

      {/* Case List Table */}
      <div className="cyber-panel rounded-lg border border-border-cyber/30 overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#0b132a] border-b border-border-cyber/30 text-slate-400">
                <th className="p-4 uppercase tracking-wider text-[10px]">Case Number</th>
                <th className="p-4 uppercase tracking-wider text-[10px] hidden md:table-cell">Complainant</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Category</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">District/Station</th>
                <th className="p-4 uppercase tracking-wider text-[10px] text-center">AI Severity</th>
                <th className="p-4 uppercase tracking-wider text-[10px] text-center">Priority</th>
                <th className="p-4 uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="p-4 uppercase tracking-wider text-[10px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-slate-950/25">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs font-mono">
                    NO COMPLAINTS REGISTERED MATCHING FILTER CRITERIA
                  </td>
                </tr>
              ) : (
                filteredComplaints.map(comp => (
                  <tr key={comp.id} className="hover:bg-slate-900/60 transition-colors group">
                    <td className="p-4 font-bold text-white tracking-wider flex flex-col">
                      <span>{comp.complaint_number}</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(comp.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 hidden md:table-cell">
                      <div className="font-semibold">{comp.complainant_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{comp.complainant_phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-200">{comp.category}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 uppercase">{comp.district}</div>
                      <div className="text-[10px] text-slate-500 uppercase mt-0.5">{comp.station}</div>
                    </td>
                    <td className="p-4 text-center">
                      {getSeverityBadge(comp.ai_severity_score)}
                    </td>
                    <td className="p-4 text-center">
                      {getPriorityBadge(comp.priority)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(comp.status)}
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        href={`/dashboard/complaints/${comp.id}`}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b1428] border border-border-cyber/30 group-hover:border-primary-cyber text-primary-cyber group-hover:bg-primary-cyber group-hover:text-slate-950 rounded text-[10px] transition-all font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>INSPECT</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
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
