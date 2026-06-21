const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    console.error("Could not read .env.local file. Proceeding with empty env.", e);
  }

  const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseSecret = getEnvVar('SUPABASE_SECRET_KEY');

  if (!supabaseUrl || !supabaseSecret) {
    console.log("Missing URL or Secret");
    return;
  }

  const adminClient = createClient(supabaseUrl, supabaseSecret);

  try {
    const { data: users, error } = await adminClient.auth.admin.listUsers();
    if (error) {
      console.log("Auth users error:", error);
    } else {
      console.log("Total Auth Users:", users.users.length);
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
}

main();
