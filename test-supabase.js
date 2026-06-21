const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODM2MTcsImV4cCI6MjA5NzM1OTYxN30.0OfW9Z8EuJAOCMbW1CRAMdOiio5TuVzsGmnC6OUjpxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    // Test Complaints Count
    const { count: complaintsCount, error: cErr } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });
    
    if (cErr) throw cErr;

    // Test Officers Count (profiles)
    const { count: officersCount, error: oErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (oErr) throw oErr;

    // District Count
    // Assuming distinct districts from profiles or we can query the 'districts' table if it exists
    // Let's get all profiles and count unique districts
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('district');
    
    if (pErr) throw pErr;
    
    const districts = new Set(profiles.filter(p => p.district).map(p => p.district));
    const districtCount = districts.size;

    console.log(JSON.stringify({
      success: true,
      complaintsCount,
      officersCount,
      districtCount
    }));

  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

runTest();
