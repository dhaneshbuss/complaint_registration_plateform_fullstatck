require('./load_env');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  const adminClient = createClient(supabaseUrl, supabaseSecret);

  try {
    const { data: districts, error: distErr } = await adminClient
      .from('districts')
      .select('*')
      .ilike('district_name', '%Sonbhadra%');
    
    if (distErr) throw distErr;
    console.log("Sonbhadra districts found in DB:", districts);

    if (districts.length > 0) {
      const distId = districts[0].id;
      const { data: stations, error: statErr } = await adminClient
        .from('police_stations')
        .select('*')
        .eq('district_id', distId);
      
      if (statErr) throw statErr;
      console.log(`Found ${stations.length} stations in DB for Sonbhadra:`);
      stations.forEach(s => {
         console.log(`- ${s.station_name} (ID: ${s.id}, Code: ${s.station_code})`);
      });
    }

  } catch (err) {
    console.error(err);
  }
}
main();
