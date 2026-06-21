'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface Profile {
  id: string;
  full_name: string;
  badge_number: string;
  role: 'SHO' | 'CO' | 'SP' | 'DGP';
  district: string;
  station: string;
  created_at?: string;
}

export interface CitizenProfile {
  id: string;
  citizen_id: string;
  full_name: string;
  mobile: string;
  email?: string;
}

export interface Complaint {
  id: string;
  complaint_number: string;
  complainant_name: string;
  complainant_phone: string;
  complainant_email?: string;
  description: string;
  category: string;
  ai_predicted_category?: string;
  ai_severity_score: number;
  ai_recommended_action?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Under Investigation' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
  district: string;
  station: string;
  assigned_officer_id?: string;
  created_by?: string;
  citizen_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  officer_id: string;
  officer_name: string;
  officer_badge: string;
  action: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

interface AuthContextProps {
  currentOfficer: Profile | null;
  currentCitizen: CitizenProfile | null;
  allOfficers: Profile[];
  complaints: Complaint[];
  auditLogs: AuditLog[];
  loading: boolean;
  isLiveDb: boolean;
  switchRole: (role: 'SHO' | 'CO' | 'SP' | 'DGP') => void;
  loginAsOfficer: (badgeNumber: string, pin: string) => Promise<boolean>;
  loginAsCitizen: (email: string, pin: string) => Promise<boolean>;
  registerCitizen: (data: { full_name: string; mobile: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  createComplaint: (complaint: Omit<Complaint, 'id' | 'complaint_number' | 'created_at'>) => Promise<Complaint>;
  updateComplaintStatus: (id: string, status: Complaint['status']) => Promise<void>;
  assignComplaint: (id: string, officerId: string) => Promise<void>;
  addAuditLog: (action: string, details: any) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOfficer, setCurrentOfficer] = useState<Profile | null>(null);
  const [currentCitizen, setCurrentCitizen] = useState<CitizenProfile | null>(null);
  const [allOfficers, setAllOfficers] = useState<Profile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return; // No DB configured, stay logged out
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const role = user.user_metadata?.role;
          if (role === 'Citizen') {
            const { data: citizenData } = await supabase
              .from('citizens')
              .select('*')
              .eq('id', user.id)
              .single();
            if (citizenData) {
              setCurrentCitizen(citizenData as CitizenProfile);
            }
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (profile) {
              setCurrentOfficer(profile as Profile);
            }
          }
        }
      } catch (err: any) {
        console.error("Supabase initData failed.", err);
      }
      setLoading(false);
    };

    initData();
  }, []);

  // Fetch real data if Supabase configured
  useEffect(() => {
    if (!loading && isSupabaseConfigured && supabase && currentOfficer) {
      const fetchSupabaseData = async () => {
        try {
          // Fetch complaints based on role
          let query = supabase!.from('complaints').select('*');
          
          if (currentOfficer.role === 'SHO') {
            query = query.eq('station', currentOfficer.station).eq('district', currentOfficer.district);
          } else if (currentOfficer.role === 'CO') {
            query = query.eq('district', currentOfficer.district);
          } else if (currentOfficer.role === 'SP') {
            query = query.eq('district', currentOfficer.district);
          }
          
          const { data: compList, error: compError } = await query.order('created_at', { ascending: false });
          if (compError) throw compError;
          if (compList) {
            setComplaints(compList as Complaint[]);
          }

          // Fetch audit logs
          const { data: logs, error: logsError } = await supabase!
            .from('audit_logs')
            .select('*, profiles(full_name, badge_number)')
            .order('created_at', { ascending: false });
          
          if (logsError) throw logsError;
          if (logs) {
            setAuditLogs(logs.map((l: any) => ({
              id: l.id,
              officer_id: l.officer_id,
              officer_name: l.profiles?.full_name || 'System',
              officer_badge: l.profiles?.badge_number || 'UP-SYSTEM',
              action: l.action,
              details: l.details,
              ip_address: l.ip_address,
              created_at: l.created_at
            })));
          }

          // Fetch all officers for assignment
          const { data: officersList, error: officersError } = await supabase!.from('profiles').select('*');
          if (officersError) throw officersError;
          if (officersList) {
            setAllOfficers(officersList as Profile[]);
          }
        } catch (err: any) {
          console.error("Supabase fetch data failed.", err);
        }
      };

      fetchSupabaseData();
    }
  }, [currentOfficer, loading]);

  const refreshData = async () => {
    if (isSupabaseConfigured && supabase && currentOfficer) {
      setLoading(true);
      try {
        const { data: compList, error } = await supabase!
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (compList) {
          setComplaints(compList as Complaint[]);
        }
      } catch (err) {
        console.error("Supabase refreshData failed.", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const switchRole = (role: 'SHO' | 'CO' | 'SP' | 'DGP') => {
    console.warn("switchRole is disabled in production");
  };

  const loginAsOfficer = async (badgeNumber: string, pin: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please check your environment variables.");
    }
    
    try {
      const { data: email, error: rpcError } = await supabase.rpc('get_officer_email_by_badge', {
        badge_number: badgeNumber
      });

      if (rpcError) throw rpcError;

      if (email) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: pin
        });

        if (authError) throw authError;

        if (authData.user) {
          const { data: profileObj, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

          if (profileObj) {
            setCurrentOfficer(profileObj as Profile);
            setCurrentCitizen(null);
            await addAuditLog('LOGIN', { method: 'supabase_auth', badge: badgeNumber });
            return true;
          }
        }
      }
      throw new Error("Invalid credentials or profile not found.");
    } catch (err: any) {
      console.error("DB login search/auth failed", err.message || err);
      throw err;
    }
  };

  const loginAsCitizen = async (email: string, pin: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please check your environment variables.");
    }
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: pin
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: citizenObj, error: citizenError } = await supabase
          .from('citizens')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (citizenError) throw citizenError;

        if (citizenObj) {
          setCurrentCitizen(citizenObj as CitizenProfile);
          setCurrentOfficer(null);
          return true;
        }
      }
      throw new Error("Invalid credentials or citizen profile not found.");
    } catch (err: any) {
      console.error("DB citizen login failed", err.message || err);
      throw err;
    }
  };

  const registerCitizen = async (data: { full_name: string; mobile: string; email: string; password: string }): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured.");
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            mobile: data.mobile,
            role: 'Citizen'
          }
        }
      });
      if (authError) throw authError;
      
      return await loginAsCitizen(data.email, data.password);
    } catch (err: any) {
      console.error("Supabase Auth sign-up failed:", err.message);
      throw err;
    }
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentOfficer(null);
    setCurrentCitizen(null);
  };

  const createComplaint = async (fields: Omit<Complaint, 'id' | 'complaint_number' | 'created_at'>): Promise<Complaint> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured.");
    }
    const randNum = `UPP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const { data, error } = await supabase!
        .from('complaints')
        .insert({
          complaint_number: randNum,
          complainant_name: fields.complainant_name,
          complainant_phone: fields.complainant_phone,
          complainant_email: fields.complainant_email,
          description: fields.description,
          category: fields.category,
          ai_predicted_category: fields.ai_predicted_category,
          ai_severity_score: fields.ai_severity_score,
          ai_recommended_action: fields.ai_recommended_action,
          priority: fields.priority || 'Medium',
          status: fields.status,
          district: fields.district,
          station: fields.station,
          created_by: currentOfficer?.id,
          citizen_id: currentCitizen?.id
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      const updatedList = [data as Complaint, ...complaints];
      setComplaints(updatedList);
      await addAuditLog('CREATE_COMPLAINT', { complaint_number: randNum, category: fields.category });
      return data as Complaint;
    } catch (err: any) {
      console.error("Supabase createComplaint failed.", err);
      throw err;
    }
  };

  const updateComplaintStatus = async (id: string, status: Complaint['status']): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured.");
    }

    try {
      const { error } = await supabase!
        .from('complaints')
        .update({ status })
        .eq('id', id);
      if (error) throw new Error(error.message);
      
      const updated = complaints.map(c => {
        if (c.id === id) {
          return { ...c, status, updated_at: new Date().toISOString() };
        }
        return c;
      });
      setComplaints(updated);

      const comp = complaints.find(c => c.id === id);
      const details = { id, status, complaint_number: comp?.complaint_number };
      await addAuditLog('UPDATE_STATUS', details);
    } catch (err: any) {
      console.error("Supabase updateComplaintStatus failed.", err);
      throw err;
    }
  };

  const assignComplaint = async (id: string, officerId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured.");
    }

    try {
      const { error } = await supabase!
        .from('complaints')
        .update({ assigned_officer_id: officerId })
        .eq('id', id);
      if (error) throw new Error(error.message);
      
      const targetOfficer = allOfficers.find(o => o.id === officerId);
      const updated = complaints.map(c => {
        if (c.id === id) {
          return { ...c, assigned_officer_id: officerId, updated_at: new Date().toISOString() };
        }
        return c;
      });
      setComplaints(updated);

      const comp = complaints.find(c => c.id === id);
      const details = { id, assigned_to: targetOfficer?.full_name, complaint_number: comp?.complaint_number };
      await addAuditLog('ASSIGN_CASE', details);
    } catch (err: any) {
      console.error("Supabase assignComplaint failed.", err);
      throw err;
    }
  };

  const addAuditLog = async (action: string, details: any): Promise<void> => {
    if (!isSupabaseConfigured || !supabase || !currentOfficer) {
      return;
    }
    try {
      const { error } = await supabase!.from('audit_logs').insert({
        officer_id: currentOfficer.id,
        action,
        details,
        ip_address: '10.24.12.83' // We could get this from a real header in production
      });
      if (error) throw error;
      
      // Optionally update local state, though typically we'd just re-fetch or let realtime handle it
      // Let's just fetch it again if needed or append locally
    } catch (err: any) {
      console.error("Supabase addAuditLog failed.", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentOfficer,
      currentCitizen,
      allOfficers,
      complaints,
      auditLogs,
      loading,
      isLiveDb: isSupabaseConfigured,
      switchRole,
      loginAsOfficer,
      loginAsCitizen,
      registerCitizen,
      logout,
      createComplaint,
      updateComplaintStatus,
      assignComplaint,
      addAuditLog,
      refreshData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

