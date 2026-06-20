'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentOfficer, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentOfficer) {
      router.push('/');
    }
  }, [currentOfficer, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050814]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-cyber border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-400">ESTABLISHING SECURE SESSION LINK...</p>
        </div>
      </div>
    );
  }

  if (!currentOfficer) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Global Header */}
      <Header />
      
      {/* Body container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar />
        
        {/* Content viewer */}
        <main className="flex-1 overflow-y-auto bg-[#070b19] relative p-6">
          {/* Subtle cyber glow backdrop */}
          <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none"></div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
