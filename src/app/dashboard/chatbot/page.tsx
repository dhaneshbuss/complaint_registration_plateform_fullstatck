'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  Terminal, 
  Send, 
  Cpu, 
  Database, 
  Code,
  LineChart as LineChartIcon,
  HelpCircle,
  Loader
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  LineChart, 
  Line 
} from 'recharts';

interface ChatMessage {
  id: string;
  sender: 'officer' | 'ai';
  text: string;
  sql?: string;
  visualization?: 'Table' | 'BarChart' | 'LineChart' | 'PieChart' | 'None';
  chartData?: Array<{ name: string; value: number; [key: string]: any }>;
  timestamp: Date;
}

export default function ChatbotPage() {
  const { addAuditLog } = useAuth();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'AI Police Command Analytics Chatbot initialized. Ask me analytical queries about complaints, districts, caseloads, and officer assignments. I can generate SQL and compile visual charts in real-time.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How many cyber complaints in Prayagraj?',
    'Show top 5 high severity complaints.',
    'Which category is increasing this month?',
    'How many complaints are there in each district?',
    'What is the status breakdown of registered cases?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendQuery = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user query to chat log
    const userMsgId = Math.random().toString(36).substring(7);
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'officer',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend })
      });
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: data.answer || 'No response compiled.',
        sql: data.sql,
        visualization: data.visualization || 'None',
        chartData: data.chartData || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      await addAuditLog('AI_CHAT_QUERY', { query: textToSend });
    } catch (e: any) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: 'Error connecting to database analytics server: ' + e.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Recharts color helper
  const COLORS = ['#00d2ff', '#10b981', '#f59e0b', '#ff3e3e', '#8b5cf6', '#ec4899', '#3b82f6'];

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

  const renderInlineChart = (msg: ChatMessage) => {
    if (!msg.chartData || msg.chartData.length === 0) return null;

    if (msg.visualization === 'BarChart') {
      return (
        <div className="h-48 w-full mt-4 bg-slate-950/50 p-2 border border-slate-900 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={msg.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '9px', fontFamily: 'monospace' }} allowDecimals={false} />
              <Tooltip {...customTooltipStyle} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {msg.chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (msg.visualization === 'PieChart') {
      return (
        <div className="h-48 w-full mt-4 bg-slate-950/50 p-2 border border-slate-900 rounded flex flex-col justify-between sm:flex-row items-center gap-4">
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={msg.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {msg.chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-1.5 text-[9px] font-mono w-full sm:w-auto">
            {msg.chartData.map((d, i) => (
              <div key={d.name} className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-400 truncate">{d.name}:</span>
                <span className="text-white font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (msg.visualization === 'LineChart') {
      return (
        <div className="h-48 w-full mt-4 bg-slate-950/50 p-2 border border-slate-900 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={msg.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '9px', fontFamily: 'monospace' }} allowDecimals={false} />
              <Tooltip {...customTooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#00d2ff" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (msg.visualization === 'Table') {
      const keys = Object.keys(msg.chartData[0]).filter(k => k !== 'name');
      return (
        <div className="mt-4 border border-slate-900 rounded overflow-hidden max-h-48 overflow-y-auto">
          <table className="w-full text-left font-mono text-[9px] bg-slate-950/40">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <th className="p-2">Name</th>
                {keys.map(k => (
                  <th key={k} className="p-2 capitalize">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {msg.chartData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="p-2 text-white font-bold">{row.name}</td>
                  {keys.map(k => (
                    <td key={k} className="p-2 text-slate-300">{row[k]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-7.5rem)] relative">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white font-orbitron tracking-wider flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary-cyber" />
            AI DATABASE INTEL CLIENT
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">NATURAL LANGUAGE DATABASE QUERY TERMINAL // DIRECT SQL REPORTING</p>
        </div>
        <div className="p-1 px-2.5 bg-primary-cyber/10 border border-primary-cyber/30 rounded font-mono text-[9px] text-primary-cyber uppercase flex items-center gap-1.5">
          <Database className="w-3 h-3 text-primary-cyber" />
          <span>CONNECTED: PUBLIC SCHEMA</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Terminal Chat logs: Left 3 cols */}
        <div className="lg:col-span-3 flex flex-col justify-between border border-border-cyber/30 bg-slate-950/45 rounded-lg overflow-hidden h-full relative">
          
          {/* Header flag */}
          <div className="p-2 border-b border-slate-900 bg-[#080f21] flex justify-between items-center text-[9px] font-mono text-slate-500 shrink-0">
            <span>SECURE DIALOG TERMINAL // LOGGED SESSIONS</span>
            <span>PORT: 5092</span>
          </div>

          {/* Logs timeline */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'officer' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Node icon */}
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-inner ${
                  msg.sender === 'officer' 
                    ? 'bg-slate-900 border-slate-700 text-slate-300' 
                    : 'bg-primary-cyber/15 border-primary-cyber/30 text-primary-cyber'
                }`}>
                  {msg.sender === 'officer' ? <span className="text-[10px] font-mono font-bold">OFF</span> : <Cpu className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5">
                  <div className={`text-[9px] font-mono text-slate-500 flex items-center gap-2 ${msg.sender === 'officer' ? 'justify-end' : ''}`}>
                    <span>{msg.sender === 'officer' ? 'INVESTIGATOR' : 'INTELLIGENCE CORE'}</span>
                    <span>•</span>
                    <span>{msg.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Bubble body */}
                  <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
                    msg.sender === 'officer' 
                      ? 'bg-slate-900/80 border-slate-800 text-slate-200 rounded-tr-none' 
                      : 'bg-[#091026] border-border-cyber/20 text-slate-200 rounded-tl-none'
                  }`}>
                    {/* Narrative answer */}
                    <p className="whitespace-pre-line font-sans">{msg.text}</p>

                    {/* SQL view */}
                    {msg.sql && (
                      <div className="mt-3.5 space-y-1 font-mono text-[10px] bg-slate-950 border border-slate-900 rounded-md p-3 relative group">
                        <div className="flex justify-between items-center text-[8px] text-slate-500 border-b border-slate-900 pb-1.5 mb-1.5 uppercase font-bold">
                          <span className="flex items-center gap-1"><Code className="w-3 h-3 text-accent-green" /> EXECUTED POSTGRES SELECT</span>
                          <span className="text-accent-green">COMPILE SUCCESS</span>
                        </div>
                        <code className="text-accent-green block break-all font-semibold select-all">{msg.sql}</code>
                      </div>
                    )}

                    {/* Dynamic Chart */}
                    {renderInlineChart(msg)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full border bg-primary-cyber/15 border-primary-cyber/30 text-primary-cyber flex items-center justify-center shrink-0 animate-pulse">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono text-slate-500">
                    INTELLIGENCE CORE // PARSING DATABASE LEDGER...
                  </div>
                  <div className="p-4 bg-[#091026] border border-border-cyber/10 rounded-lg rounded-tl-none text-xs flex items-center gap-3">
                    <Loader className="w-4 h-4 animate-spin text-primary-cyber" />
                    <span className="font-mono text-slate-400">TRANSLATING NATURAL LANGUAGE TO PostgreSQL SCHEMA...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery(query);
            }} 
            className="p-4 border-t border-slate-900 bg-[#080f21] flex items-center gap-3 shrink-0"
          >
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              placeholder="Ask natural language question (e.g. Which district has the most pending land dispute cases?)..."
              className="flex-1 bg-slate-950/70 border border-slate-800 focus:border-primary-cyber focus:outline-none rounded px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 transition-all"
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="p-2.5 bg-primary-cyber hover:bg-primary-cyber/95 border border-transparent rounded text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_10px_rgba(0,210,255,0.1)] shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Info panel & presets: Right 1 col */}
        <div className="space-y-6 h-full overflow-y-auto pb-4 pr-1">
          
          {/* Quick Presets */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-accent-gold font-bold border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-accent-gold" />
              ANALYTICS PRESET KEYS
            </h3>
            
            <div className="space-y-2.5 font-mono">
              {quickPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(promptText)}
                  disabled={loading}
                  className="w-full text-left p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-900 hover:border-primary-cyber/30 rounded text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer leading-relaxed flex items-start gap-2"
                >
                  <span className="text-primary-cyber mt-0.5 font-bold shrink-0">→</span>
                  <span>{promptText}</span>
                </button>
              ))}
            </div>
          </div>

          {/* How it works details */}
          <div className="cyber-panel rounded-lg p-5 border border-border-cyber/30 space-y-3 font-mono text-[11px] text-slate-400 leading-relaxed">
            <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold border-b border-slate-900 pb-2 mb-1">
              OPERATION MANUAL
            </h4>
            <p>
              1. Enter an analytics question in plain English.
            </p>
            <p>
              2. The core AI compiler generates a secure PostgreSQL `SELECT` statement targeting profiles, complaints, or audit ledger tables.
            </p>
            <p>
              3. The query is safely executed in read-only mode via a database-defined RPC sandbox function.
            </p>
            <p>
              4. Aggregated tables are parsed back to the AI engine to compose a detailed situation report and output visual charts.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
