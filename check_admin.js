require('./load_env');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

const adminClient = createClient(supabaseUrl, supabaseSecret);

async function check() {
  const { data, error } = await adminClient.auth.admin.listUsers();
  console.log("Error:", error);
  console.log("Data length:", data?.users?.length);
  console.log("Data:", JSON.stringify(data, null, 2));
}

check();
