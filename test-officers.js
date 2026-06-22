const { createClient } = require('@supabase/supabase-js');

require('./load_env');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    // Test Officers Table Count
    let officersCount = 0;
    const { count: oCount, error: oErr } = await supabase
      .from('officers')
      .select('*', { count: 'exact', head: true });
    
    if (oErr) {
        console.error("officers table error: ", oErr.message);
    } else {
        officersCount = oCount;
    }

    // Test Profiles Count
    let profilesCount = 0;
    const { count: pCount, error: pErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (pErr) throw pErr;
    profilesCount = pCount;

    // Distinct Districts in officers table
    let districtCount = 0;
    const { data: offDistricts, error: odErr } = await supabase
      .from('officers')
      .select('district');
    
    if (!odErr && offDistricts) {
        const districts = new Set(offDistricts.filter(p => p.district).map(p => p.district));
        districtCount = districts.size;
    }

    // Distinct stations in officers table
    let stationCount = 0;
    const { data: offStations, error: osErr } = await supabase
      .from('officers')
      .select('station');
    
    if (!osErr && offStations) {
        const stations = new Set(offStations.filter(p => p.station).map(p => p.station));
        stationCount = stations.size;
    }

    console.log(JSON.stringify({
      success: true,
      officersCount,
      profilesCount,
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
