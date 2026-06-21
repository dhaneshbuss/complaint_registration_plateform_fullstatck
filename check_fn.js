const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {}

  const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseSecret = getEnvVar('SUPABASE_SECRET_KEY');

  const adminClient = createClient(supabaseUrl, supabaseSecret);

  try {
    const { data, error } = await adminClient.rpc('get_officer_email_by_badge', { badge_number: 'TEST' });
    console.log("RPC Check Result:", { data, error });
  } catch(e) {
    console.log("Error:", e.message);
  }
}

main();
