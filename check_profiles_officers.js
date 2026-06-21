const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function check() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');
  const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get the 7 profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  
  // Get matching officers
  const badgeNumbers = profiles.map(p => p.badge_number);
  const { data: officers } = await supabase.from('officers').select('id, email, belt_number, name').in('belt_number', badgeNumbers);

  console.log("Profiles:");
  console.log(profiles.map(p => ({ id: p.id, badge: p.badge_number })));

  console.log("Officers:");
  console.log(officers);
}
check();
