require('./load_env');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  const adminClient = createClient(supabaseUrl, supabaseSecret);

  try {
    const { data: officers, error } = await adminClient
      .from('officers')
      .select('*')
      .eq('district_id', '6583bdae-f0eb-05be-db01-60b330d3eed0');
    
    if (error) throw error;
    console.log(`Found ${officers.length} officers in DB for Sonbhadra district.`);

    const roles = {};
    officers.forEach(o => {
      roles[o.role] = (roles[o.role] || 0) + 1;
    });
    console.log("Roles breakdown in Sonbhadra:", roles);

    console.log("\nSome SSP/SP, CO, and SHO officers:");
    officers
      .filter(o => ['SSP/SP', 'CO', 'SHO'].includes(o.role))
      .forEach(o => {
         console.log(`- ID: ${o.id} | Name: ${o.name} | Role: ${o.role} | Rank: ${o.rank} | Belt: ${o.belt_number}`);
      });

  } catch (err) {
    console.error(err);
  }
}
main();
