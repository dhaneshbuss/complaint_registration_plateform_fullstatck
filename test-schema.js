const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODM2MTcsImV4cCI6MjA5NzM1OTYxN30.0OfW9Z8EuJAOCMbW1CRAMdOiio5TuVzsGmnC6OUjpxY';

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
