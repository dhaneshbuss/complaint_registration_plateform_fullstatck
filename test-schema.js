const { createClient } = require('@supabase/supabase-js');

require('./load_env');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    const { data: officers } = await supabase.from('officers').select('*').limit(1);
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    
    // Get counts for report
    const { data: offDistricts } = await supabase.from('officers').select('district_id');
    const districts = new Set(offDistricts?.filter(p => p.district_id).map(p => p.district_id) || []);
    
    const { data: offStations } = await supabase.from('officers').select('station_id');
    const stations = new Set(offStations?.filter(p => p.station_id).map(p => p.station_id) || []);
    
    const { count: shoCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'SHO');
    const { count: ioCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'IO');
    const { count: coCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'CO');
    const { count: spCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'SP');

    console.log("Officers schema:", Object.keys(officers?.[0] || {}));
    console.log("Profiles schema:", Object.keys(profiles?.[0] || {}));
    console.log(`Districts: ${districts.size}, Stations: ${stations.size}, SHO: ${shoCount}, IO: ${ioCount}, CO: ${coCount}, SP: ${spCount}`);
  } catch (error) {
    console.error(error);
  }
}

runTest();
