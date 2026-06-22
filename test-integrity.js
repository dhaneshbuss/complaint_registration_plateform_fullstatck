const { createClient } = require('@supabase/supabase-js');

require('./load_env');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    // 1. SELECT COUNT(*) FROM districts;
    const { count: cDistricts, error: e1 } = await supabase.from('districts').select('*', { count: 'exact', head: true });
    
    // 2. SELECT COUNT(*) FROM police_stations;
    const { count: cStations, error: e2 } = await supabase.from('police_stations').select('*', { count: 'exact', head: true });
    
    // 3. SELECT COUNT(*) FROM officers;
    const { count: cOfficers, error: e3 } = await supabase.from('officers').select('*', { count: 'exact', head: true });

    // 4. SELECT COUNT(DISTINCT district) FROM officers;
    // 5. SELECT COUNT(DISTINCT station) FROM officers;
    // We will fetch all and compute distinct district_id and station_id (assuming those are the column names based on earlier query)
    const { data: officersData, error: e4 } = await supabase.from('officers').select('district_id, station_id');
    
    let distinctDistricts = 0;
    let distinctStations = 0;
    let nullDistricts = 0;
    let nullStations = 0;
    
    const districtCounts = {};

    if (officersData) {
        const dSet = new Set();
        const sSet = new Set();
        
        for (const o of officersData) {
            if (o.district_id === null || o.district_id === undefined) {
                nullDistricts++;
            } else {
                dSet.add(o.district_id);
                districtCounts[o.district_id] = (districtCounts[o.district_id] || 0) + 1;
            }

            if (o.station_id === null || o.station_id === undefined) {
                nullStations++;
            } else {
                sSet.add(o.station_id);
            }
        }
        
        distinctDistricts = dSet.size;
        distinctStations = sSet.size;
    }

    // Top 20 districts by officer count
    const top20 = Object.entries(districtCounts)
        .map(([id, count]) => ({ district_id: id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    console.log("1. SELECT COUNT(*) FROM districts: " + (e1 ? "Table not found/Error" : cDistricts));
    console.log("2. SELECT COUNT(*) FROM police_stations: " + (e2 ? "Table not found/Error" : cStations));
    console.log("3. SELECT COUNT(*) FROM officers: " + (e3 ? "Error" : cOfficers));
    console.log("4. SELECT COUNT(DISTINCT district_id) FROM officers: " + distinctDistricts);
    console.log("5. SELECT COUNT(DISTINCT station_id) FROM officers: " + distinctStations);
    
    console.log("\nTop 20 districts by officer count:");
    top20.forEach((d, i) => {
        console.log(`   ${i + 1}. District ID ${d.district_id}: ${d.count} officers`);
    });

    console.log("\nNULL value check:");
    console.log(`   Officers with NULL district_id: ${nullDistricts}`);
    console.log(`   Officers with NULL station_id: ${nullStations}`);

  } catch (error) {
    console.error(error);
  }
}

runTest();
