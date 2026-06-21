const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseSecret = getEnvVar('SUPABASE_SECRET_KEY');

  const adminClient = createClient(supabaseUrl, supabaseSecret);

  try {
    const badges = ['UP-000001', 'UP-204857', 'UP-930485', 'UP-827461'];
    const { data: officers } = await adminClient
      .from('officers')
      .select(`
        badge_number,
        rank,
        district_id,
        station_id,
        districts ( name ),
        police_stations ( name )
      `)
      .in('badge_number', badges);
      
    console.log("Test Officers Details:");
    console.dir(officers, { depth: null });

    const { data: citizens } = await adminClient.from('profiles').select('*').limit(5);
    console.log("\nSample Citizen Profiles:");
    console.dir(citizens, { depth: null });

  } catch(e) {
    console.log("Error:", e.message);
  }
}

main();
