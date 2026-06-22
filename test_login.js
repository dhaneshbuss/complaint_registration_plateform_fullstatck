require('./load_env');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'rajeev.krishna@uppolice.gov.in',
    password: 'UPP@123'
  });
  
  if (error) {
    console.log("Login Error:", error.message);
  } else {
    console.log("Login Success! User ID:", data.user.id);
  }
}
testLogin();
