import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if Supabase has been properly configured
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseUrl.includes('.supabase.co') && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key'
);

// Instantiate supabase client, or return null for client-side fallback
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
