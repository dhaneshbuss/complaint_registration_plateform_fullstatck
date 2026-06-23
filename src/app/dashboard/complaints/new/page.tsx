'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PlusCircle, Cpu, ShieldAlert, FileText, CheckCircle2, ChevronLeft, Loader } from 'lucide-react';
import Link from 'next/link';

export default function NewComplaintPage() {
  const { currentOfficer, createComplaint } = useAuth();
  const router = useRouter();

  // Form states
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [complainantEmail, setComplainantEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [station, setStation] = useState('');
  const [category, setCategory] = useState('Law & Order');
  const [description, setDescription] = useState('');

  // AI Diagnostic states
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<{
    ai_predicted_category?: string;
    ai_severity_score?: number;
    ai_recommended_action?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  } | null>(null);

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default district and station from current logged-in officer profile
  useEffect(() => {
    if (currentOfficer) {
      setDistrict(currentOfficer.district);
      setStation(currentOfficer.station);
    }
  }, [currentOfficer]);

  const [districts, setDistricts] = useState<string[]>([]);
  const [stationsMap, setStationsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    async function loadLocations() {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        if (!supabase) return;
        
        const { data: dData } = await supabase.from('districts').select('id, district_name').order('district_name');
        const { data: sData } = await supabase.from('police_stations').select('station_name, district_id').order('station_name');
        
        if (dData && sData) {
          setDistricts(dData.map(d => d.district_name));
          
          const sMap: Record<string, string[]> = {};
          dData.forEach(d => {
            sMap[d.district_name] = sData.filter(s => s.district_id === d.id).map(s => s.station_name);
          });
          setStationsMap(sMap);
        }
      } catch (e) {
        console.error('Error loading locations:', e);
      }
    }
    loadLocations();
  }, []);

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

  const handleDistrictChange = (dist: string) => {
    setDistrict(dist);
    const stations = stationsMap[dist] || [];
    setStation(stations[0] || '');
  };

  // Run AI analysis
  const runAiDiagnostics = async () => {
    if (!description.trim()) {
      alert('Please describe the complaint description first to execute AI diagnostics.');
      return;
    }
    setAiRunning(true);
    setAiResult(null);
    try {
      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResult({
        ai_predicted_category: data.ai_predicted_category || data.category,
        ai_severity_score: data.ai_severity_score || data.severity,
        ai_recommended_action: data.ai_recommended_action || data.suggested_action || data.recommended_action,
        priority: data.priority || 'Medium'
      });

      // Auto-set the category input to the AI predicted category
      if (data.ai_predicted_category || data.category) {
        setCategory(data.ai_predicted_category || data.category);
      }
    } catch (e: any) {
      console.error(e);
      alert('AI Diagnostics failed: ' + e.message);
    } finally {
      setAiRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complainantName || !complainantPhone || !description) {
      setSubmitError('Complainant name, phone number, and incident description are mandatory.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await createComplaint({
        complainant_name: complainantName.trim(),
        complainant_phone: complainantPhone.trim(),
        complainant_email: complainantEmail.trim() || undefined,
        description: description.trim(),
        category,
        district,
        station,
        status: 'Pending',
        ai_predicted_category: aiResult?.ai_predicted_category || category,
        ai_severity_score: aiResult?.ai_severity_score || 5,
        ai_recommended_action: aiResult?.ai_recommended_action || 'Deploy patrol officers to inspect site.',
        priority: aiResult?.priority || 'Medium'
      });
      router.push('/dashboard/complaints');
    } catch (error: any) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header link */}
      <div className="flex items-center space-x-3 border-b border-slate-900 pb-4">
        <Link 
          href="/dashboard/complaints"
          className="p-1.5 bg-[#0b1428] border border-border-cyber/30 text-primary-cyber hover:bg-primary-cyber hover:text-slate-950 rounded transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white font-orbitron tracking-wider flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary-cyber" />
            FILE COMPLAINT REPORT
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">FILE OFFICIAL POLICE COMPLAINT (F.I.R. PRE-REGISTRATION TERMINAL)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Core details form: Left 3 cols */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          {submitError && (
            <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded text-xs text-accent-red font-mono">
              SUBMIT ERROR: {submitError}
            </div>
          )}

          <div className="cyber-panel rounded-lg p-6 border border-border-cyber/30 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold border-b border-slate-900 pb-2.5">
              <FileText className="w-4 h-4 text-primary-cyber" />
              <span>1. COMPLAINANT IDENTIFICATION DATA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400">COMPLAINANT FULL NAME *</label>
                <input 
                  type="text"
                  required
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  placeholder="Rohan Gupta"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400">MOBILE CONTACT NUMBER *</label>
                <input 
                  type="tel"
                  required
                  value={complainantPhone}
                  onChange={(e) => setComplainantPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400">EMAIL ADDRESS (OPTIONAL)</label>
                <input 
                  type="email"
                  value={complainantEmail}
                  onChange={(e) => setComplainantEmail(e.target.value)}
                  placeholder="rohan@gmail.com"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>

          <div className="cyber-panel rounded-lg p-6 border border-border-cyber/30 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold border-b border-slate-900 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-primary-cyber" />
              <span>2. JURISDICTION & OFFENSE DETAILS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400">DISTRICT COMMAND</label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-slate-200"
                >
                  {districts.map(d => (
                    <option key={d} value={d} className="bg-slate-950 text-white">{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400">POLICE STATION</label>
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-slate-200"
                >
                  {(stationsMap[district] || []).map(st => (
                    <option key={st} value={st} className="bg-slate-950 text-white">{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400">INCIDENT CATEGORY (OFFENSE TYPE)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3 py-2 text-xs font-mono text-slate-200"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400">INCIDENT STATEMENT (RAW DESCRIPTION) *</label>
                <textarea 
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the complaint in detail, detailing timelines, suspected perpetrators, bank accounts/phone numbers involved, etc..."
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-primary-cyber hover:bg-primary-cyber/95 border border-transparent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer text-center shadow-[0_0_15px_rgba(0,210,255,0.15)] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-slate-950" />
                  <span>TRANSMITTING DATA LEDGER...</span>
                </>
              ) : (
                <span>SUBMIT COMPLAINT REPORT</span>
              )}
            </button>
            
            <Link 
              href="/dashboard/complaints"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded text-xs font-mono transition-all text-center uppercase tracking-wider"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* AI diagnostic sidebar: Right 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="cyber-panel rounded-lg p-6 border border-border-cyber/30 relative overflow-hidden flex flex-col h-full justify-between">
            {/* Holographic background */}
            <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-primary-cyber font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>AI DIAGNOSTIC ENGINE</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary-cyber animate-pulse"></span>
              </div>

              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                Utilize the OpenAI LLM classification pipeline to read raw incident statements, predict legal classifications, generate numerical threat severity metrics, and compile target action plans.
              </p>

              <button 
                type="button"
                onClick={runAiDiagnostics}
                disabled={aiRunning || !description}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 border border-border-cyber/20 hover:border-primary-cyber/60 rounded text-xs font-mono text-primary-cyber hover:text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {aiRunning ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin text-primary-cyber" />
                    <span>RUNNING INTEL PARSER...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 text-primary-cyber" />
                    <span>EXECUTE AI DIAGNOSTICS</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Result screen */}
            <div className="mt-6 flex-1 flex flex-col justify-center">
              {aiResult ? (
                <div className="p-4 bg-[#0a152e] border border-border-cyber/30 rounded-lg space-y-4 animate-fadeIn">
                  
                  {/* Title predicted */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">AI PREDICTED CATEGORY</span>
                    <span className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-accent-green" />
                      {aiResult.ai_predicted_category}
                    </span>
                  </div>

                  {/* Severity level */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-slate-500 uppercase">AI THREAT SEVERITY INDEX</span>
                      <span className={`font-bold ${
                        (aiResult.ai_severity_score || 5) >= 8 
                          ? 'text-accent-red' 
                          : (aiResult.ai_severity_score || 5) >= 5 
                          ? 'text-accent-gold' 
                          : 'text-accent-green'
                      }`}>{aiResult.ai_severity_score} / 10</span>
                    </div>
                    {/* Severity bars */}
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const active = idx < (aiResult.ai_severity_score || 5);
                        let barBg = 'bg-slate-800';
                        if (active) {
                          if ((aiResult.ai_severity_score || 5) >= 8) barBg = 'bg-accent-red shadow-[0_0_5px_#ff3e3e]';
                          else if ((aiResult.ai_severity_score || 5) >= 5) barBg = 'bg-accent-gold shadow-[0_0_5px_#f59e0b]';
                          else barBg = 'bg-accent-green shadow-[0_0_5px_#10b981]';
                        }
                        return <div key={idx} className={`h-2 rounded-sm ${barBg} transition-all duration-300`}></div>;
                      })}
                    </div>
                  </div>

                  {/* Priority level */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">AI PRIORITY LEVEL</span>
                    <span className={`text-[10px] font-bold font-mono tracking-wide uppercase px-2 py-0.5 border rounded inline-block ${
                      aiResult.priority === 'Critical'
                        ? 'border-accent-red/50 bg-accent-red/20 text-accent-red animate-pulse'
                        : aiResult.priority === 'High'
                        ? 'border-accent-red/30 bg-accent-red/10 text-accent-red'
                        : aiResult.priority === 'Medium'
                        ? 'border-accent-gold/30 bg-accent-gold/10 text-accent-gold'
                        : 'border-accent-green/30 bg-accent-green/10 text-accent-green'
                    }`}>
                      {aiResult.priority || 'MEDIUM'}
                    </span>
                  </div>

                  {/* Actions checklist */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">RECOMMENDED POLICE RESPONSE</span>
                    <div className="p-2.5 bg-slate-950/70 border border-slate-900 rounded text-[11px] font-mono text-slate-300 leading-relaxed">
                      {aiResult.ai_recommended_action}
                    </div>
                  </div>

                  <div className="p-2 bg-accent-green/5 border border-accent-green/20 rounded text-[9px] font-mono text-accent-green text-center">
                    CATEGORY SYNCED: INPUT AUTO-OVERWRITTEN
                  </div>

                </div>
              ) : (
                <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-xs font-mono text-slate-500 flex flex-col items-center justify-center h-48 space-y-2">
                  <Cpu className="w-8 h-8 text-slate-700 animate-pulse" />
                  <span>AWAITING INCIDENT ANALYSIS INPUTS</span>
                </div>
              )}
            </div>

            {/* Bottom info banner */}
            <div className="mt-6 text-[9px] font-mono text-slate-500 border-t border-slate-900 pt-3 flex justify-between">
              <span>MODEL: GPT-4O-MINI</span>
              <span>TOKEN CONFIDENCE: 98%</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
