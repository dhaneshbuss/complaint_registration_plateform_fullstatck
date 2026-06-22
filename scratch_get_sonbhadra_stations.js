const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStations() {
  const { data, error } = await supabaseAdmin
    .from('police_stations')
    .select('id, name, district')
    .eq('district', 'Sonbhadra');

  if (error) {
    console.error('Error fetching stations:', error);
  } else {
    console.log('Sonbhadra stations:', data);
  }
}

checkStations();
