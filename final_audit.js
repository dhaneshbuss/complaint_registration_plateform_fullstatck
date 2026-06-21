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
  const supabaseSecret = getEnvVar('SUPABASE_SECRET_KEY');

  if (!supabaseUrl || !supabaseSecret) {
    console.log("Missing URL or Secret");
    return;
  }

  const adminClient = createClient(supabaseUrl, supabaseSecret);

  try {
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers();
    console.log("Total Auth Users:", users?.users?.length || 0);

    const tables = ['profiles', 'officers', 'complaints', 'districts', 'police_stations'];
    
    for (const table of tables) {
      const { count, error } = await adminClient.from(table).select('*', { count: 'exact', head: true });
      console.log(`Total ${table}:`, count);
    }
    
    const { data: latestComplaints } = await adminClient.from('complaints').select('*').order('created_at', { ascending: false }).limit(10);
    console.log("\nLatest 10 complaints:", JSON.stringify(latestComplaints, null, 2));

    const { data: officers } = await adminClient.from('officers').select('badge_number, rank, district:districts(name), station:police_stations(name)').limit(5);
    console.log("\nSample Officers:", JSON.stringify(officers, null, 2));

  } catch(e) {
    console.log("Error:", e.message);
  }
}

main();
