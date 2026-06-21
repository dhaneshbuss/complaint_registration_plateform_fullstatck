const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODM2MTcsImV4cCI6MjA5NzM1OTYxN30.0OfW9Z8EuJAOCMbW1CRAMdOiio5TuVzsGmnC6OUjpxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    // Distinct Districts in officers table
    let districtCount = 0;
    const { data: offDistricts, error: odErr } = await supabase
      .from('officers')
      .select('district_id');
    
    if (!odErr && offDistricts) {
        const districts = new Set(offDistricts.filter(p => p.district_id).map(p => p.district_id));
        districtCount = districts.size;
    }

    // Distinct stations in officers table
    let stationCount = 0;
    const { data: offStations, error: osErr } = await supabase
      .from('officers')
      .select('station_id');
    
    if (!osErr && offStations) {
        const stations = new Set(offStations.filter(p => p.station_id).map(p => p.station_id));
        stationCount = stations.size;
    }

    console.log(JSON.stringify({
      success: true,
      districtCount,
      stationCount
    }));

  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

runTest();
