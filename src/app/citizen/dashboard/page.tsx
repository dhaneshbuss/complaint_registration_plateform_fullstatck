'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FileText, PlusCircle, Search, AlertCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CitizenDashboard() {
  const router = useRouter();
  const { currentCitizen, complaints, logout } = useAuth();
  
  // Filter complaints that belong to the current citizen (by citizen_id or complainant_phone/email as fallback)
  const myComplaints = complaints.filter(c => 
    c.citizen_id === currentCitizen?.id || 
    (currentCitizen?.mobile && c.complainant_phone === currentCitizen.mobile)
  );

  useEffect(() => {
    if (!currentCitizen) {
      router.push('/citizen/login');
    }
  }, [currentCitizen, router]);

  if (!currentCitizen) return null;

  const handleLogout = () => {
    logout();
    router.push('/citizen/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Under Investigation': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {currentCitizen.full_name}</h1>
          <p className="text-gray-500 mt-1">Citizen ID: <span className="font-mono">{currentCitizen.citizen_id}</span></p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Complaints</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{myComplaints.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">
              {myComplaints.filter(c => c.status === 'Pending').length}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Resolved</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {myComplaints.filter(c => c.status === 'Resolved').length}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Your Recent Complaints</h2>
        <div className="flex space-x-3">
          <Link href="/citizen/complaints/track" className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Search className="w-4 h-4 mr-2" />
            Track Status
          </Link>
          <Link href="/citizen/complaints/new" className="flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Complaint
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {myComplaints.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No complaints found</h3>
            <p className="text-gray-500 mt-2 max-w-md">You haven't registered any complaints yet. Click the button below to report an issue.</p>
            <Link href="/citizen/complaints/new" className="mt-6 inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
              <PlusCircle className="w-4 h-4 mr-2" />
              Register Complaint
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-900">{complaint.complaint_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{new Date(complaint.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{complaint.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/citizen/complaints/track?number=${complaint.complaint_number}`} className="text-blue-600 hover:text-blue-900 flex items-center justify-end">
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
