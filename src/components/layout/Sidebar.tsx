'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  PlusCircle, 
  Terminal, 
  ScrollText, 
  LogOut,
  FolderOpen,
  Brain
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentOfficer, logout } = useAuth();

  if (!currentOfficer) return null;

  const menuItems = [
    {
      name: 'Analytics Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SHO', 'CO', 'SP', 'DGP']
    },
    {
      name: 'Case Management',
      path: '/dashboard/complaints',
      icon: FolderOpen,
      roles: ['SHO', 'CO', 'SP', 'DGP']
    },
    {
      name: 'Predictive Intelligence',
      path: '/dashboard/predictive',
      icon: Brain,
      roles: ['SHO', 'CO', 'SP', 'DGP']
    },
    {
      name: 'Register Complaint',
      path: '/dashboard/complaints/new',
      icon: PlusCircle,
      roles: ['SHO', 'CO', 'SP', 'DGP'] // Normally SHO registers, but let all roles view it for testing
    },
    {
      name: 'AI Intel Chatbot',
      path: '/dashboard/chatbot',
      icon: Terminal,
      roles: ['SHO', 'CO', 'SP', 'DGP']
    },
    {
      name: 'Security Audit Logs',
      path: '/dashboard/audit-logs',
      icon: ScrollText,
      roles: ['DGP', 'SP'] // Restricted to SP and DGP
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentOfficer.role));

  return (
    <aside className="w-64 bg-[#060a17] border-r border-border-cyber/50 flex flex-col justify-between h-[calc(100vh-4.5rem)] relative">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-4 space-y-7 relative z-10">
        <div>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3 mb-3">
            Core Command
          </div>
          <nav className="space-y-1.5">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-md text-xs font-mono transition-all group relative ${
                    isActive 
                      ? 'bg-primary-cyber/15 border-l-2 border-primary-cyber text-white font-semibold shadow-[0_0_10px_rgba(0,210,255,0.05)]' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-cyber' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System parameters display */}
        <div className="p-3 bg-slate-950/70 border border-slate-900 rounded-md font-mono text-[10px] text-slate-500 space-y-1">
          <div className="text-slate-400 font-bold border-b border-slate-900 pb-1 mb-1.5 flex items-center justify-between">
            <span>SYS PARAMETERS</span>
            <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-ping"></span>
          </div>
          <div>STATION: <span className="text-slate-300">{currentOfficer.station.toUpperCase()}</span></div>
          <div>DISTRICT: <span className="text-slate-300">{currentOfficer.district.toUpperCase()}</span></div>
          <div>LATENCY: <span className="text-slate-300">0.08ms</span></div>
          <div>ENCRYPTION: <span className="text-slate-300">AES-256</span></div>
        </div>
      </div>

      {/* Log out box */}
      <div className="p-4 border-t border-border-cyber/30 bg-slate-950/40 relative z-10">
        <div className="mb-3 p-2.5 bg-slate-950/80 border border-border-cyber/20 rounded font-mono text-[10px] text-slate-400 flex flex-col space-y-1">
          <div className="flex justify-between">
            <span>OFFICER BADGE:</span>
            <span className="text-primary-cyber font-bold">{currentOfficer.badge_number}</span>
          </div>
          <div className="flex justify-between">
            <span>ACCESS SCOPE:</span>
            <span className="text-accent-gold font-bold">{currentOfficer.role === 'DGP' ? 'STATEWIDE' : currentOfficer.role === 'SP' ? 'DISTRICT' : 'LOCAL'}</span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-slate-900/60 hover:bg-accent-red/20 border border-slate-800 hover:border-accent-red/50 py-2 rounded text-xs font-mono text-slate-400 hover:text-white transition-all shadow-inner"
        >
          <LogOut className="w-3.5 h-3.5 text-accent-red" />
          <span>OFFLINE SYSTEM</span>
        </button>
      </div>
    </aside>
  );
};
