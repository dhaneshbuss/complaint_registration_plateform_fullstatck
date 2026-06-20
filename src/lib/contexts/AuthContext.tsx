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

// Static mock profiles mirroring database seeds
const mockProfiles: Profile[] = [
  { id: '11111111-1111-1111-1111-111111111111', full_name: 'Devendra Singh', badge_number: 'UP-827461', role: 'SHO', district: 'Lucknow', station: 'Hazratganj' },
  { id: '22222222-2222-2222-2222-222222222222', full_name: 'Rakesh Verma', badge_number: 'UP-930485', role: 'CO', district: 'Lucknow', station: 'Hazratganj' },
  { id: '33333333-3333-3333-3333-333333333333', full_name: 'Priyanka Sen', badge_number: 'UP-204857', role: 'SP', district: 'Noida', station: 'Sector 39' },
  { id: '44444444-4444-4444-4444-444444444444', full_name: 'Rajeev Krishna', badge_number: 'UP-000001', role: 'DGP', district: 'Lucknow', station: 'Hazratganj' },
  { id: '55555555-5555-5555-5555-555555555555', full_name: 'Amit Rawat', badge_number: 'UP-746352', role: 'SHO', district: 'Noida', station: 'Sector 39' },
  { id: '66666666-6666-6666-6666-666666666666', full_name: 'Vikram Aditya', badge_number: 'UP-583920', role: 'SHO', district: 'Kanpur', station: 'Kalyanpur' }
];

// Seed complaints
const defaultMockComplaints: Complaint[] = [
  { id: 'c1', complaint_number: 'UPP-2026-0001', complainant_name: 'Rohan Gupta', complainant_phone: '9876543210', complainant_email: 'rohan@gmail.com', description: 'Received a call from an unknown number claiming to be a bank manager. They asked for my OTP and debited 75,000 INR from my account.', category: 'Cyber Crime', ai_predicted_category: 'Cyber Crime', ai_severity_score: 8, ai_recommended_action: 'Freeze the destination UPI account, request transaction details from the bank, and trace IP of phone logs.', priority: 'High', status: 'Pending', district: 'Lucknow', station: 'Hazratganj', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 'c2', complaint_number: 'UPP-2026-0002', complainant_name: 'Sunita Sharma', complainant_phone: '9123456789', complainant_email: 'sunita.s@yahoo.com', description: 'A local group has been passing inappropriate comments and stalking me daily during my commute back from work near Hazratganj crossing.', category: 'Women Safety', ai_predicted_category: 'Women Safety', ai_severity_score: 7, ai_recommended_action: 'Increase evening patrolling in the Hazratganj crossing area and review CCTV footage near the crossing.', priority: 'High', status: 'Under Investigation', district: 'Lucknow', station: 'Hazratganj', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'c3', complaint_number: 'UPP-2026-0003', complainant_name: 'Rajesh Yadav', complainant_phone: '9456123478', description: 'Land mafia has illegally occupied our ancestral agriculture plot in Sector 39. They threatened us with physical violence when we approached them.', category: 'Land Dispute', ai_predicted_category: 'Land Dispute', ai_severity_score: 6, ai_recommended_action: 'Initiate circle officer inquiry, review registry papers, and dispatch local police to prevent further construction.', priority: 'Medium', status: 'Pending', district: 'Noida', station: 'Sector 39', created_by: '55555555-5555-5555-5555-555555555555', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'c4', complaint_number: 'UPP-2026-0004', complainant_name: 'Anita Mishra', complainant_phone: '8877665544', complainant_email: 'anita.m@gmail.com', description: 'My husband and his parents beat me and demanded 5 Lakhs INR as dowry. They locked me in a room for two days before I managed to escape.', category: 'Domestic Violence', ai_predicted_category: 'Domestic Violence', ai_severity_score: 9, ai_recommended_action: 'Provide immediate counseling/medical checkup, issue summons to the husband/in-laws, and file FIR under section 498A.', priority: 'Critical', status: 'Under Investigation', district: 'Kanpur', station: 'Kalyanpur', created_by: '66666666-6666-6666-6666-666666666666', created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'c5', complaint_number: 'UPP-2026-0005', complainant_name: 'Meera Devi', complainant_phone: '9988776655', description: 'My 9-year-old child went to the local grocery shop in Kalyanpur yesterday evening at 5 PM and has not returned since. We have checked with all relatives.', category: 'Child Safety', ai_predicted_category: 'Missing Person', ai_severity_score: 10, ai_recommended_action: 'Issue nationwide yellow notice, broadcast description to nearby districts, and search local railway/bus stations.', priority: 'Critical', status: 'Escalated', district: 'Kanpur', station: 'Kalyanpur', created_by: '66666666-6666-6666-6666-666666666666', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'c6', complaint_number: 'UPP-2026-0006', complainant_name: 'Surendra Nath', complainant_phone: '9080706050', complainant_email: 'surendra.n@outlook.com', description: 'Invested 5 Lakhs in a cryptocurrency scheme promising 20% weekly returns. The website is now down and the managers are untraceable.', category: 'Financial Fraud', ai_predicted_category: 'Financial Fraud', ai_severity_score: 7, ai_recommended_action: 'Request host records from the domain provider, freeze associated bank accounts, and register under fraud section 420.', priority: 'High', status: 'Pending', district: 'Noida', station: 'Sector 39', created_by: '55555555-5555-5555-5555-555555555555', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'c7', complaint_number: 'UPP-2026-0007', complainant_name: 'Karan Johar', complainant_phone: '7010203040', complainant_email: 'karan@gmail.com', description: 'A local shopkeeper is selling illegal country-made firearms from his backyard in Kalyanpur. There are active buyers gathering late night.', category: 'Law & Order', ai_predicted_category: 'Law & Order', ai_severity_score: 9, ai_recommended_action: 'Conduct a midnight raid with adequate police force, secure weapons, and arrest suspects under the Arms Act.', priority: 'Critical', status: 'Resolved', district: 'Kanpur', station: 'Kalyanpur', created_by: '66666666-6666-6666-6666-666666666666', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'c8', complaint_number: 'UPP-2026-0008', complainant_name: 'Kshitij Verma', complainant_phone: '8123459876', complainant_email: 'kshitij@gmail.com', description: 'Received extortion messages on WhatsApp demanding 2 Lakhs. The threat says they will leak private photos if the money isn\'t paid in 24 hours.', category: 'Cyber Crime', ai_predicted_category: 'Cyber Crime', ai_severity_score: 8, ai_recommended_action: 'Notify WhatsApp security for account block, trace the mobile tower location, and advice victim on digital safety.', priority: 'High', status: 'Under Investigation', district: 'Lucknow', station: 'Hazratganj', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'c9', complaint_number: 'UPP-2026-0009', complainant_name: 'Savita Devi', complainant_phone: '9345678120', description: 'A neighborhood dispute over water drainage has turned into physical violence. Two neighbors are injured and threats are being made openly.', category: 'Law & Order', ai_predicted_category: 'Law & Order', ai_severity_score: 5, ai_recommended_action: 'Deploy static police pickets to calm local tensions, record statements, and initiate boundary mediation.', priority: 'Medium', status: 'Resolved', district: 'Lucknow', station: 'Hazratganj', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'c10', complaint_number: 'UPP-2026-0010', complainant_name: 'Rahul Saxena', complainant_phone: '7456781234', complainant_email: 'rahul@gmail.com', description: 'My online identity was cloned. Someone made a Facebook profile using my photos and is asking money from my contacts claiming emergency.', category: 'Cyber Crime', ai_predicted_category: 'Cyber Crime', ai_severity_score: 4, ai_recommended_action: 'Report profile clone to Meta, request IP logs of the creator, and share warning message on social media status.', priority: 'Low', status: 'Pending', district: 'Noida', station: 'Sector 39', created_by: '55555555-5555-5555-5555-555555555555', created_at: new Date().toISOString() }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOfficer, setCurrentOfficer] = useState<Profile | null>(null);
  const [currentCitizen, setCurrentCitizen] = useState<CitizenProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to load offline simulated data
  const loadOfflineMockData = () => {
    const savedSim = localStorage.getItem('up_simulated_officer');
    const savedCit = localStorage.getItem('up_simulated_citizen');
    if (savedSim) {
      setCurrentOfficer(JSON.parse(savedSim));
    } else if (savedCit) {
      setCurrentCitizen(JSON.parse(savedCit));
    } else {
      setCurrentOfficer(mockProfiles[3]); // Default to DGP
      localStorage.setItem('up_simulated_officer', JSON.stringify(mockProfiles[3]));
    }

    // Load mock complaints
    const savedComplaints = localStorage.getItem('up_mock_complaints');
    if (savedComplaints) {
      setComplaints(JSON.parse(savedComplaints));
    } else {
      setComplaints(defaultMockComplaints);
      localStorage.setItem('up_mock_complaints', JSON.stringify(defaultMockComplaints));
    }

    // Load mock audit logs
    const savedLogs = localStorage.getItem('up_mock_audit_logs');
    if (savedLogs) {
      setAuditLogs(JSON.parse(savedLogs));
    } else {
      const initialLogs: AuditLog[] = [
        { id: 'l1', officer_id: '44444444-4444-4444-4444-444444444444', officer_name: 'Rajeev Krishna', officer_badge: 'UP-000001', action: 'SYSTEM_BOOT', details: { msg: 'Police Command Intelligence Dashboard booted successfully.' }, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'l2', officer_id: '11111111-1111-1111-1111-111111111111', officer_name: 'Devendra Singh', officer_badge: 'UP-827461', action: 'LOGIN', details: { ip: '10.24.8.192' }, created_at: new Date(Date.now() - 12 * 3600000).toISOString() }
      ];
      setAuditLogs(initialLogs);
      localStorage.setItem('up_mock_audit_logs', JSON.stringify(initialLogs));
    }
  };

  // Initialize
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          // Try getting logged in Supabase auth user
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
          } else {
            // If no active auth user but Supabase is configured, check localStorage simulated officer
            const savedSim = localStorage.getItem('up_simulated_officer');
            const savedCit = localStorage.getItem('up_simulated_citizen');
            if (savedSim) {
              setCurrentOfficer(JSON.parse(savedSim));
            } else if (savedCit) {
              setCurrentCitizen(JSON.parse(savedCit));
            } else {
              // Default to DGP Devendra
              setCurrentOfficer(mockProfiles[3]);
              localStorage.setItem('up_simulated_officer', JSON.stringify(mockProfiles[3]));
            }
          }
        } else {
          loadOfflineMockData();
        }
      } catch (err: any) {
        console.warn("Supabase initData failed. Falling back to offline mock data.", err);
        loadOfflineMockData();
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
          
          // RLS policies are enforced on the database, but we can explicitly filter to save bandwidth
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
        } catch (err: any) {
          console.warn("Supabase fetch data failed. Falling back to offline mock data load.", err);
          // Load local simulated lists
          const savedComplaints = localStorage.getItem('up_mock_complaints');
          if (savedComplaints) {
            setComplaints(JSON.parse(savedComplaints));
          } else {
            setComplaints(defaultMockComplaints);
          }
          const savedLogs = localStorage.getItem('up_mock_audit_logs');
          if (savedLogs) {
            setAuditLogs(JSON.parse(savedLogs));
          }
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
        console.warn("Supabase refreshData failed. Retaining offline data.", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const switchRole = (role: 'SHO' | 'CO' | 'SP' | 'DGP') => {
    const selected = mockProfiles.find(p => p.role === role);
    if (selected) {
      setCurrentOfficer(selected);
      setCurrentCitizen(null);
      localStorage.setItem('up_simulated_officer', JSON.stringify(selected));
      localStorage.removeItem('up_simulated_citizen');
      addAuditLog('ROLE_SWITCH', { target_role: role, officer: selected.full_name });
    }
  };

  const loginAsOfficer = async (badgeNumber: string, pin: string): Promise<boolean> => {
    // 1. Database validation if Supabase is live
    if (isSupabaseConfigured && supabase) {
      try {
        // Query the officer's email from the RPC function to bypass RLS for anonymous client
        const { data: email, error: rpcError } = await supabase.rpc('get_officer_email_by_badge', {
          badge_number: badgeNumber
        });

        if (rpcError) {
          console.error("RPC email lookup failed:", rpcError.message);
          throw rpcError;
        }

        if (email) {
          // Attempt real Supabase Auth sign-in using their email and the PIN (password)
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: pin
          });

          if (authError) {
            console.error("Supabase Auth sign-in failed:", authError.message);
            throw authError;
          }

          if (authData.user) {
            // Fetch their full mapped profile (allowed since they are now authenticated!)
            const { data: profileObj, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (profileError) {
              console.error("Failed to retrieve profile:", profileError.message);
              throw profileError;
            }

            if (profileObj) {
              setCurrentOfficer(profileObj as Profile);
              setCurrentCitizen(null);
              localStorage.setItem('up_simulated_officer', JSON.stringify(profileObj));
              localStorage.removeItem('up_simulated_citizen');
              await addAuditLog('LOGIN', { method: 'supabase_auth', badge: badgeNumber });
              return true;
            }
          }
        }
      } catch (err: any) {
        console.warn("DB login search/auth failed, falling back to mock", err.message || err);
      }
    }

    // 2. Offline fallback
    const found = mockProfiles.find(p => p.badge_number === badgeNumber);
    if (found) {
      if (pin === 'UPP@123' || pin === `UPP@${badgeNumber}`) {
        setCurrentOfficer(found);
        setCurrentCitizen(null);
        localStorage.setItem('up_simulated_officer', JSON.stringify(found));
        localStorage.removeItem('up_simulated_citizen');
        await addAuditLog('LOGIN', { method: 'badge_number', badge: badgeNumber });
        return true;
      }
    }
    return false;
  };

  const loginAsCitizen = async (email: string, pin: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
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
            localStorage.setItem('up_simulated_citizen', JSON.stringify(citizenObj));
            localStorage.removeItem('up_simulated_officer');
            return true;
          }
        }
      } catch (err: any) {
        console.warn("DB login search/auth failed, falling back to mock", err.message || err);
      }
    }

    // Offline fallback for citizen
    const mockCitizen: CitizenProfile = {
      id: 'cit1',
      citizen_id: 'CIT-UP-000001',
      full_name: 'Test Citizen',
      mobile: '9999999999',
      email: email
    };
    setCurrentCitizen(mockCitizen);
    setCurrentOfficer(null);
    localStorage.setItem('up_simulated_citizen', JSON.stringify(mockCitizen));
    localStorage.removeItem('up_simulated_officer');
    return true;
  };

  const registerCitizen = async (data: { full_name: string; mobile: string; email: string; password: string }): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
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
      }
    }
    
    // Offline fallback
    return await loginAsCitizen(data.email, data.password);
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentOfficer(null);
    setCurrentCitizen(null);
    localStorage.removeItem('up_simulated_officer');
    localStorage.removeItem('up_simulated_citizen');
  };

  const createComplaint = async (fields: Omit<Complaint, 'id' | 'complaint_number' | 'created_at'>): Promise<Complaint> => {
    const randNum = `UPP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComp: Complaint = {
      ...fields,
      id: Math.random().toString(36).substring(7),
      complaint_number: randNum,
      created_at: new Date().toISOString(),
      created_by: currentOfficer?.id,
      citizen_id: currentCitizen?.id
    };

    const saveToOfflineMock = async () => {
      const updatedList = [newComp, ...complaints];
      setComplaints(updatedList);
      localStorage.setItem('up_mock_complaints', JSON.stringify(updatedList));
      await addAuditLog('CREATE_COMPLAINT', { complaint_number: randNum, category: fields.category });
      return newComp;
    };

    if (isSupabaseConfigured && supabase) {
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
        
        // Refresh local state list
        const updatedList = [data as Complaint, ...complaints];
        setComplaints(updatedList);
        await addAuditLog('CREATE_COMPLAINT', { complaint_number: randNum, category: fields.category });
        return data as Complaint;
      } catch (err: any) {
        console.warn("Supabase createComplaint failed. Falling back to offline mock storage.", err);
        return saveToOfflineMock();
      }
    } else {
      return saveToOfflineMock();
    }
  };

  const updateComplaintStatus = async (id: string, status: Complaint['status']): Promise<void> => {
    const updated = complaints.map(c => {
      if (c.id === id) {
        return { ...c, status, updated_at: new Date().toISOString() };
      }
      return c;
    });

    setComplaints(updated);

    const comp = complaints.find(c => c.id === id);
    const details = { id, status, complaint_number: comp?.complaint_number };

    const runOfflineUpdate = async () => {
      localStorage.setItem('up_mock_complaints', JSON.stringify(updated));
      await addAuditLog('UPDATE_STATUS', details);
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase!
          .from('complaints')
          .update({ status })
          .eq('id', id);
        if (error) throw new Error(error.message);
        await addAuditLog('UPDATE_STATUS', details);
      } catch (err: any) {
        console.warn("Supabase updateComplaintStatus failed. Falling back to offline mock.", err);
        await runOfflineUpdate();
      }
    } else {
      await runOfflineUpdate();
    }
  };

  const assignComplaint = async (id: string, officerId: string): Promise<void> => {
    const targetOfficer = mockProfiles.find(o => o.id === officerId);
    
    const updated = complaints.map(c => {
      if (c.id === id) {
        return { ...c, assigned_officer_id: officerId, updated_at: new Date().toISOString() };
      }
      return c;
    });

    setComplaints(updated);

    const comp = complaints.find(c => c.id === id);
    const details = { id, assigned_to: targetOfficer?.full_name, complaint_number: comp?.complaint_number };

    const runOfflineAssign = async () => {
      localStorage.setItem('up_mock_complaints', JSON.stringify(updated));
      await addAuditLog('ASSIGN_CASE', details);
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase!
          .from('complaints')
          .update({ assigned_officer_id: officerId })
          .eq('id', id);
        if (error) throw new Error(error.message);
        await addAuditLog('ASSIGN_CASE', details);
      } catch (err: any) {
        console.warn("Supabase assignComplaint failed. Falling back to offline mock.", err);
        await runOfflineAssign();
      }
    } else {
      await runOfflineAssign();
    }
  };

  const addAuditLog = async (action: string, details: any): Promise<void> => {
    const randId = Math.random().toString(36).substring(7);
    const newLog: AuditLog = {
      id: randId,
      officer_id: currentOfficer?.id || 'system',
      officer_name: currentOfficer?.full_name || 'System',
      officer_badge: currentOfficer?.badge_number || 'UP-SYSTEM',
      action,
      details,
      ip_address: '10.24.12.83',
      created_at: new Date().toISOString()
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);

    const runOfflineLog = () => {
      localStorage.setItem('up_mock_audit_logs', JSON.stringify(updatedLogs));
    };

    if (isSupabaseConfigured && supabase && currentOfficer) {
      try {
        const { error } = await supabase!.from('audit_logs').insert({
          officer_id: currentOfficer.id,
          action,
          details,
          ip_address: '10.24.12.83'
        });
        if (error) throw error;
      } catch (err: any) {
        console.warn("Supabase addAuditLog failed. Falling back to offline log.", err);
        runOfflineLog();
      }
    } else {
      runOfflineLog();
    }
  };

  return (
    <AuthContext.Provider value={{
      currentOfficer,
      currentCitizen,
      allOfficers: mockProfiles,
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
