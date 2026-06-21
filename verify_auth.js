const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    console.error("Could not read .env.local file. Proceeding with empty env.", e);
  }

  const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Missing Supabase URL or Anon Key");
    return;
  }

  console.log("Using Anon Key:", supabaseAnonKey.substring(0, 15) + "...");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Total profiles
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profilesError) {
       console.log("Profiles Error with Anon Key:", profilesError);
       // Try service role key if anon key fails due to RLS
       const srKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
       const adminSupabase = createClient(supabaseUrl, srKey);
       const { count: c, error: e } = await adminSupabase.from('profiles').select('*', { count: 'exact', head: true });
       if (e) { console.log("Admin error too:", e); }
       else { console.log("Profiles count (Admin):", c); }
    } else {
       console.log("Profiles count:", profilesCount);
    }

    // List badge numbers and roles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('badge_number, role');

    if (pError) {
      console.log("Error fetching profiles:", pError);
    } else if (profiles) {
      console.log("Profiles records fetched:", profiles.length);

      const dgp = profiles.find(p => p.role === 'DGP');
      const sho = profiles.find(p => p.role === 'SHO');
      const io = profiles.find(p => p.role === 'IO');
      const sp = profiles.find(p => p.role === 'SP');
      const co = profiles.find(p => p.role === 'CO');

      console.log("DGP Badge:", dgp ? dgp.badge_number : 'Not found');
      console.log("SP Badge:", sp ? sp.badge_number : 'Not found');
      console.log("CO Badge:", co ? co.badge_number : 'Not found');
      console.log("SHO Badge:", sho ? sho.badge_number : 'Not found');
      console.log("IO Badge:", io ? io.badge_number : 'Not found');
      
      const uniqueRoles = [...new Set(profiles.map(p => p.role))];
      console.log("Available Roles:", uniqueRoles.join(", "));
    }

  } catch (err) {
    console.error("Script error:", err);
  }
}

main();
