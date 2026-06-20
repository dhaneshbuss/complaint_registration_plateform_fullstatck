import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Detect if Supabase Admin has been configured
export const isAdminConfigured = !!(
  supabaseUrl && 
  supabaseUrl.includes('.supabase.co') && 
  serviceRoleKey && 
  serviceRoleKey !== 'your-supabase-service-role-key'
);

// Create a server-safe admin client that bypasses RLS and handles system commands
export const supabaseAdmin = isAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
