const { createClient } = require('@supabase/supabase-js');

require('./load_env');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
