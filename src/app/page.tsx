'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const { currentOfficer, loginAsOfficer, logout, loading, isLiveDb } = useAuth();
  const router = useRouter();
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Captcha security
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const regenerateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0, O, I, 1
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    regenerateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLiveDb) {
      setError('Database configuration error. System is offline.');
      return;
    }

    if (!badgeNumber) {
      setError('Please provide a valid badge number.');
      return;
    }
    if (!password) {
      setError('Please provide your security PIN / password.');
      return;
    }
    if (captchaInput.toUpperCase() !== generatedCaptcha) {
      setError('Invalid Captcha Code. Verification failed.');
      regenerateCaptcha();
      return;
    }

    try {
      const success = await loginAsOfficer(badgeNumber.trim(), password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Unauthorized badge number or officer record not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please retry.');
    }
  };

  const handleQuickLogin = async (badge: string) => {
    if (!isLiveDb) {
      setError('Database configuration error. System is offline.');
      return;
    }
    try {
      const success = await loginAsOfficer(badge, 'UPP@123');
      if (success) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050814]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-cyber border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-400">ESTABLISHING ENCRYPTED SESSION...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#050814]">
      {/* Background patterns */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-cyber/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 scanline">
        
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary-cyber/5 rounded-full border border-primary-cyber/30 mb-4 shadow-[0_0_20px_rgba(0,210,255,0.08)]">
            <Shield className="w-10 h-10 text-primary-cyber" />
          </div>
          <h2 className="text-2xl font-black font-orbitron tracking-widest text-white">UP POLICE</h2>
          <p className="text-xs text-primary-cyber uppercase font-mono tracking-wider mt-1">AI COMPLAINT INTELLIGENCE PORTAL</p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">UTTAR PRADESH POLICE HEADQUARTERS // SECURITY ACCESS</p>
        </div>

        {/* Login Card */}
        <div className="cyber-panel rounded-lg shadow-2xl p-8 border border-border-cyber/30 relative">
          
          <div className="absolute top-0 left-4 px-2 py-0.5 bg-slate-900 border-l border-r border-b border-border-cyber text-[9px] font-mono text-slate-400">
            SECURE ACCESS terminal
          </div>

          {!isLiveDb && (
            <div className="mb-6 mt-2 p-4 bg-accent-red/10 border border-accent-red/30 rounded flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-red shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-accent-red">SYSTEM OFFLINE</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Supabase database connection is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.
                </p>
              </div>
            </div>
          )}

          {currentOfficer ? (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex p-3 bg-primary-cyber/10 rounded-full border border-primary-cyber/30">
                <Shield className="w-8 h-8 text-primary-cyber" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">You are already logged in</h3>
                <p className="text-xs text-slate-400">
                  Secure session detected for <span className="text-primary-cyber font-mono">{currentOfficer.full_name}</span>
                </p>
              </div>
              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2.5 bg-primary-cyber hover:bg-primary-cyber/90 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(0,210,255,0.2)]"
                >
                  Continue to Dashboard
                </button>
                <button 
                  onClick={() => logout()}
                  className="w-full py-2.5 bg-transparent hover:bg-slate-800 border border-border-cyber/50 text-slate-300 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  Logout and Login with Different Account
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-5 mt-3">
                {error && (
                  <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded flex items-start gap-2.5 text-xs text-accent-red">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-300">BADGE NUMBER (IDENTIFICATION)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="e.g. UP-000001" 
                      disabled={!isLiveDb}
                      className="w-full bg-slate-950/70 border border-border-cyber/30 focus:border-primary-cyber focus:outline-none rounded px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-300">SECURITY PIN (PASSWORD)</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. UPP@123" 
                      disabled={!isLiveDb}
                      className="w-full bg-slate-950/70 border border-border-cyber/30 focus:border-primary-cyber focus:outline-none rounded pl-3.5 pr-10 py-2 text-xs font-mono text-white placeholder-slate-600 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!isLiveDb}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500">Default PIN for all officers: UPP@123</p>
                </div>

                {/* Captcha Box */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-300">VERIFICATION CAPTCHA</label>
                    <div className="flex items-stretch gap-2">
                      <div className="flex-1 flex items-center justify-center bg-[#070d1e] border border-border-cyber/30 rounded select-none relative overflow-hidden py-1 px-3 shadow-inner">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                        <span className="text-sm font-bold font-orbitron tracking-widest text-primary-cyber select-none italic line-through decoration-slate-500/50">
                          {generatedCaptcha}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={regenerateCaptcha}
                        disabled={!isLiveDb}
                        className="px-2 bg-slate-950 border border-border-cyber/20 hover:border-primary-cyber/45 text-[8px] font-mono text-slate-400 hover:text-primary-cyber rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        RELOAD
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-300">ENTER CAPTCHA</label>
                    <input 
                      type="text" 
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Code" 
                      maxLength={5}
                      disabled={!isLiveDb}
                      className="w-full bg-slate-950/70 border border-border-cyber/30 focus:border-primary-cyber focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 transition-all uppercase tracking-wider text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!isLiveDb}
                  className="w-full py-2.5 bg-primary-cyber hover:bg-primary-cyber/90 border border-transparent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(0,210,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  INITIATE SECURE LINK
                </button>
              </form>

              {/* Quick simulation switcher */}
              <div className="mt-8 pt-6 border-t border-slate-900">
                <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-accent-gold" />
                  DEMO COMMAND TERMINALS (ONE-CLICK LOGIN)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => handleQuickLogin('UP-000001')}
                    disabled={!isLiveDb}
                    className="p-2.5 bg-[#0b1328]/60 hover:bg-slate-900 border border-border-cyber/20 hover:border-primary-cyber/50 text-left rounded transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-white group-hover:text-primary-cyber transition-colors">Rajeev Krishna (DGP)</div>
                    <div className="text-[9px] font-mono text-slate-400">Badge: UP-000001 (Statewide)</div>
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('UP-204857')}
                    disabled={!isLiveDb}
                    className="p-2.5 bg-[#0b1328]/60 hover:bg-slate-900 border border-border-cyber/20 hover:border-primary-cyber/50 text-left rounded transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-white group-hover:text-primary-cyber transition-colors">Priyanka Sen (SP)</div>
                    <div className="text-[9px] font-mono text-slate-400">Badge: UP-204857 (Noida SP)</div>
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('UP-930485')}
                    disabled={!isLiveDb}
                    className="p-2.5 bg-[#0b1328]/60 hover:bg-slate-900 border border-border-cyber/20 hover:border-primary-cyber/50 text-left rounded transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-white group-hover:text-primary-cyber transition-colors">Rakesh Verma (CO)</div>
                    <div className="text-[9px] font-mono text-slate-400">Badge: UP-930485 (Lucknow CO)</div>
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('UP-827461')}
                    disabled={!isLiveDb}
                    className="p-2.5 bg-[#0b1328]/60 hover:bg-slate-900 border border-border-cyber/20 hover:border-primary-cyber/50 text-left rounded transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-white group-hover:text-primary-cyber transition-colors">Devendra Singh (SHO)</div>
                    <div className="text-[9px] font-mono text-slate-400">Badge: UP-827461 (Hazratganj SHO)</div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[9px] font-mono text-slate-500">
          SYSTEM IS SUBJECT TO FULL LAWFUL MONITORING // FOR OFFICIAL USE ONLY
        </div>
      </div>
    </main>
  );
}
