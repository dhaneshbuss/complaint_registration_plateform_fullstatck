const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODM2MTcsImV4cCI6MjA5NzM1OTYxN30.0OfW9Z8EuJAOCMbW1CRAMdOiio5TuVzsGmnC6OUjpxY';

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
