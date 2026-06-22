require('./load_env');
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: profiles } = await supabase.from('profiles').select('*');
  const badgeNumbers = profiles.map(p => p.badge_number);
  const { data: officers } = await supabase.from('officers').select('id, belt_number, name').in('belt_number', badgeNumbers);

  profiles.forEach(p => {
    const o = officers.find(off => off.belt_number === p.badge_number);
    console.log(`Profile ID: ${p.id} | Officer ID: ${o ? o.id : 'None'} | Match: ${o && o.id === p.id ? 'YES' : 'NO'}`);
  });
}
check();
