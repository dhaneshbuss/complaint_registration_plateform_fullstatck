import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Citizen Portal Navbar */}
      <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-yellow-500 mr-3" />
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-wide">UP POLICE</span>
                <span className="text-xs text-blue-200">Public Citizen Portal</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
              <Link href="/citizen/dashboard" className="hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/citizen/complaints/new" className="hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                File Complaint
              </Link>
              <Link href="/citizen/complaints/track" className="hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Track Status
              </Link>
              <div className="border-l border-blue-700 h-6 mx-2"></div>
              <Link href="/citizen/login" className="hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Login
              </Link>
              <Link href="/citizen/register" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">© 2026 Uttar Pradesh Police. All rights reserved.</p>
          <p className="text-xs text-gray-500 mt-2">Emergency? Dial 112.</p>
        </div>
      </footer>
    </div>
  );
}
