'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Search, AlertCircle, CheckCircle, Clock, FileText, ArrowRight, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import Link from 'next/link';

function TrackComplaintContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get('number') || '';
  
  const { complaints } = useAuth(); // For offline fallback
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchData, setSearchData] = useState({
    complaint_number: initialNumber,
    mobile: ''
  });
  
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    // If we have an initial number from URL, we can pre-fill
    // But we still require mobile number for security if public tracking, or we can just search if they are logged in.
    // For this public portal, we'll wait for the user to submit both or at least one if allowed.
  }, [initialNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchData({ ...searchData, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!searchData.complaint_number || !searchData.mobile) {
      setError('Both Complaint Number and Mobile Number are required for verification.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        // Query Supabase using an RPC or direct select if policies allow public tracking with these fields
        // Assuming RLS allows us to read if we know the exact number and phone, or we might need an RPC function.
        // For now, we will attempt a direct select (might fail if RLS is strict, requiring RPC).
        const { data, error } = await supabase
          .from('complaints')
          .select('complaint_number, status, created_at, category, complainant_name, description')
          .eq('complaint_number', searchData.complaint_number)
          .eq('complainant_phone', searchData.mobile)
          .single();

        if (error) {
          throw new Error('Complaint not found or details do not match.');
        }
        
        if (data) {
          setResult(data);
        }
      } else {
        // Offline mock fallback
        const found = complaints.find(c => 
          c.complaint_number === searchData.complaint_number && 
          c.complainant_phone === searchData.mobile
        );
        
        if (found) {
          setResult(found);
        } else {
          setError('Complaint not found. Please verify your details.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Complaint not found. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Under Investigation': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-indigo-100 text-indigo-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Escalated': return 'bg-orange-100 text-orange-800';
      case 'Closed': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStep = (status: string) => {
    if (['Pending'].includes(status)) return 1;
    if (['Under Investigation', 'In Progress', 'Escalated'].includes(status)) return 2;
    if (['Resolved', 'Closed'].includes(status)) return 3;
    return 1;
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-blue-900">Track Complaint Status</h1>
        <p className="text-gray-500 mt-2">Enter your complaint number and registered mobile number to check the current status.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Number</label>
            <input
              type="text"
              name="complaint_number"
              required
              value={searchData.complaint_number}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black uppercase"
              placeholder="e.g. UPP-2026-01501"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              required
              value={searchData.mobile}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="10-digit number"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors focus:ring-4 focus:ring-blue-200 font-medium flex justify-center items-center h-[42px]"
          >
            {loading ? 'Searching...' : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Track Status
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3 text-yellow-400" />
              <h2 className="text-xl font-bold">Complaint Details</h2>
            </div>
            <span className="font-mono bg-blue-800 px-3 py-1 rounded text-sm">
              {result.complaint_number}
            </span>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="mb-10">
              {/* Status Timeline */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-between">
                  {/* Step 1 */}
                  <div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white ${getStatusStep(result.status) >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -ml-4 mt-2 w-20 text-center">
                      <p className="text-xs font-semibold text-gray-900">Registered</p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white ${getStatusStep(result.status) >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -ml-6 mt-2 w-24 text-center">
                      <p className="text-xs font-semibold text-gray-900">Investigating</p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white ${getStatusStep(result.status) >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -ml-4 mt-2 w-20 text-center">
                      <p className="text-xs font-semibold text-gray-900">Resolved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Basic Information</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs text-gray-500">Current Status</dt>
                    <dd className="mt-1">
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Date Registered</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{new Date(result.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{result.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Complainant Name</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{result.complainant_name}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.description}</p>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Link href="/citizen/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackComplaint() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto mt-8 text-center p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    }>
      <TrackComplaintContent />
    </Suspense>
  );
}
