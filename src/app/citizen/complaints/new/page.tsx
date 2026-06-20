'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Shield, MapPin, Tag, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function NewComplaint() {
  const router = useRouter();
  const { currentCitizen, createComplaint } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [districts, setDistricts] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    district: '',
    station: ''
  });

  const CATEGORIES = [
    'Cyber Crime', 'Women Safety', 'Child Safety', 'Land Dispute', 
    'Financial Fraud', 'Law & Order', 'Missing Person', 'Domestic Violence'
  ];

  // Fetch districts on load
  useEffect(() => {
    const loadDistricts = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('districts').select('*');
        if (data) setDistricts(data);
      } else {
        // Fallback mock
        setDistricts([{ id: '1', district_name: 'Lucknow' }, { id: '2', district_name: 'Kanpur' }, { id: '3', district_name: 'Noida' }]);
      }
    };
    loadDistricts();
  }, []);

  // Fetch stations when district changes
  useEffect(() => {
    const loadStations = async () => {
      if (formData.district) {
        if (isSupabaseConfigured && supabase) {
          // If we had the exact id, we could use it, but we are storing district name in forms.
          // For now, let's just fetch all or mock based on name.
          const { data } = await supabase.from('police_stations').select('*, districts!inner(district_name)').eq('districts.district_name', formData.district);
          if (data) setStations(data);
        } else {
          setStations([{ id: '1', station_name: 'Hazratganj' }, { id: '2', station_name: 'Kalyanpur' }, { id: '3', station_name: 'Sector 39' }]);
        }
      } else {
        setStations([]);
      }
    };
    loadStations();
  }, [formData.district]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCitizen) {
      setError("You must be logged in to register a complaint.");
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const newComp = await createComplaint({
        complainant_name: currentCitizen.full_name,
        complainant_phone: currentCitizen.mobile,
        complainant_email: currentCitizen.email,
        description: formData.description,
        category: formData.category,
        ai_severity_score: 5, // Default before AI processing
        status: 'Pending',
        district: formData.district,
        station: formData.station
      });

      setSuccess(`Complaint registered successfully. Your Tracking Number is: ${newComp.complaint_number}`);
      // Clear form
      setFormData({ category: '', description: '', district: '', station: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Link href="/citizen/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-6 pb-6 border-b border-gray-100">
          <div className="bg-blue-50 p-3 rounded-full mr-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Register New Complaint</h1>
            <p className="text-gray-500">Please provide detailed information to help us assist you.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-6 bg-green-50 text-green-800 rounded-lg text-center">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-lg">{success}</p>
            <Link href="/citizen/dashboard" className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
              Go to Dashboard
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Category *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black appearance-none"
                  >
                    <option value="" disabled>Select a category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black appearance-none"
                  >
                    <option value="" disabled>Select District</option>
                    {districts.map((d: any) => (
                      <option key={d.id} value={d.district_name}>{d.district_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Police Station *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="station"
                    required
                    disabled={!formData.district || stations.length === 0}
                    value={formData.station}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="" disabled>Select Station</option>
                    {stations.map((s: any) => (
                      <option key={s.id} value={s.station_name}>{s.station_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description of Incident *</label>
              <textarea
                name="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Please describe the incident in detail, including date, time, location, and involved persons if known..."
              />
              <p className="text-xs text-gray-500 mt-2">Note: False complaints are punishable under law.</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg mr-4 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !currentCitizen}
                className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors focus:ring-4 focus:ring-blue-200 font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
