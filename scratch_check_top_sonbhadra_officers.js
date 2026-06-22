require('./load_env');
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: officers, error } = await supabase
    .from('officers')
    .select('*')
    .eq('district_id', '6583bdae-f0eb-05be-db01-60b330d3eed0');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Sonbhadra officers in DB (${officers.length}):`);
  const top = officers.filter(o => ['SSP/SP', 'CO', 'ADG', 'DIG', 'SP'].includes(o.role) || o.rank.includes('SP') || o.rank.includes('CO'));
  top.forEach(o => {
    console.log(`- ${o.name} | Role: ${o.role} | Rank: ${o.rank} | Belt: ${o.belt_number}`);
  });
}
check();
