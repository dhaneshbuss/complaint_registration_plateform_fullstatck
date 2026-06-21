const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseSecret = 'sb_secret_Tz72DGRBYhmlcv8_Mb3OBg_ZmQ6wd-r';

const adminClient = createClient(supabaseUrl, supabaseSecret);

async function check() {
  const { data, error } = await adminClient.auth.admin.listUsers();
  console.log("Error:", error);
  console.log("Data length:", data?.users?.length);
  console.log("Data:", JSON.stringify(data, null, 2));
}

check();
