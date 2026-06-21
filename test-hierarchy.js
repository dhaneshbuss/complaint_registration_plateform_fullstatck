const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODM2MTcsImV4cCI6MjA5NzM1OTYxN30.0OfW9Z8EuJAOCMbW1CRAMdOiio5TuVzsGmnC6OUjpxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    // Total SHO records
    const { count: shoCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'SHO');
    
    // Total SI records (assuming SI is in rank or role)
    // I should check if 'SI' is in role or rank. Let's try both.
    const { count: siRoleCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'SI');
    const { count: siRankCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).ilike('rank', '%SI%');
    
    // Total IO records
    const { count: ioCount } = await supabase.from('officers').select('*', { count: 'exact', head: true }).eq('role', 'IO');
    
    // Total stations
    const { count: stationCount } = await supabase.from('police_stations').select('*', { count: 'exact', head: true });

    // Check multiple SHOs per station
    const { data: shos } = await supabase.from('officers').select('station_id').eq('role', 'SHO').not('station_id', 'is', null);
    
    const shoCountsPerStation = {};
    for (const sho of shos) {
        shoCountsPerStation[sho.station_id] = (shoCountsPerStation[sho.station_id] || 0) + 1;
    }
    
    const stationsWithMultipleSHOs = Object.entries(shoCountsPerStation).filter(([id, count]) => count > 1);
    
    let multipleSHONames = [];
    if (stationsWithMultipleSHOs.length > 0) {
        const stationIds = stationsWithMultipleSHOs.map(([id]) => id);
        const { data: stations } = await supabase.from('police_stations').select('id, station_name').in('id', stationIds);
        
        multipleSHONames = stations.map(s => {
            const count = shoCountsPerStation[s.id];
            return `${s.station_name} (${count} SHOs)`;
        });
    }

    console.log(`Total SHO records: ${shoCount}`);
    console.log(`Total SI records (by role): ${siRoleCount}`);
    console.log(`Total SI records (by rank): ${siRankCount}`);
    console.log(`Total IO records: ${ioCount}`);
    console.log(`Total stations: ${stationCount}`);
    
    console.log(`\nDoes any station have more than one SHO? ${stationsWithMultipleSHOs.length > 0 ? 'Yes' : 'No'}`);
    
    if (multipleSHONames.length > 0) {
        console.log(`\nStations with > 1 SHO:`);
        multipleSHONames.forEach(name => console.log(` - ${name}`));
    }

  } catch (error) {
    console.error(error);
  }
}

runTest();
