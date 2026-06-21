'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { User, Lock, AlertCircle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

export default function CitizenRegister() {
  const router = useRouter();
  const { registerCitizen, isLiveDb } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLiveDb) {
      setError('Database configuration error. System is offline.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (formData.mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const success = await registerCitizen({
        full_name: formData.full_name,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password
      });

      if (success) {
        router.push('/citizen/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-md border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900">Citizen Registration</h1>
        <p className="text-gray-500 mt-2">Create an account to register complaints online</p>
      </div>

      {!isLiveDb && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start text-sm">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-bold">SYSTEM OFFLINE</p>
            <p className="mt-1 text-xs">Supabase database connection is not configured.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="full_name"
              required
              disabled={!isLiveDb}
              value={formData.full_name}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black disabled:opacity-50 disabled:bg-gray-100"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="mobile"
              required
              pattern="[0-9]{10}"
              disabled={!isLiveDb}
              value={formData.mobile}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black disabled:opacity-50 disabled:bg-gray-100"
              placeholder="10-digit mobile number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              required
              disabled={!isLiveDb}
              value={formData.email}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black disabled:opacity-50 disabled:bg-gray-100"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              disabled={!isLiveDb}
              value={formData.password}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black disabled:opacity-50 disabled:bg-gray-100"
              placeholder="Min 6 characters"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              name="confirm_password"
              required
              disabled={!isLiveDb}
              value={formData.confirm_password}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black disabled:opacity-50 disabled:bg-gray-100"
              placeholder="Retype password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isLiveDb}
          className="w-full bg-blue-900 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors focus:ring-4 focus:ring-blue-200 font-medium disabled:opacity-50 disabled:bg-blue-900"
        >
          {loading ? 'Creating Account...' : 'Register as Citizen'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/citizen/login" className="text-blue-700 hover:underline font-medium">
          Login here
        </Link>
      </div>
    </div>
  );
}
