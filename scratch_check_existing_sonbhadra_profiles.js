require('./load_env');
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('district', 'Sonbhadra');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${profiles.length} profiles in Sonbhadra district:`);
  profiles.forEach(p => {
    console.log(`- ${p.full_name} | Role: ${p.role} | Badge: ${p.badge_number} | Station: ${p.station}`);
  });
}
check();
