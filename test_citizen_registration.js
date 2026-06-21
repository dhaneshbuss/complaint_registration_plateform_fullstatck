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
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const testEmail = `test.admin.citizen.${Date.now()}@example.com`;
  
  console.log("Attempting Admin sign up with:", testEmail);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Citizen',
      mobile: '9998887776',
      role: 'Citizen'
    }
  });

  if (authError) {
    console.log("Auth Error:", authError);
  } else {
    console.log("Auth Success:", authData.user?.id);
    
    // Check if inserted into citizens table
    const { data: citData, error: citError } = await supabase
      .from('citizens')
      .select('*')
      .eq('id', authData.user?.id);
      
    if (citError) {
        console.log("Citizens table fetch error:", citError);
    } else {
        console.log("Citizens table records:", citData.length);
        console.log(citData);
    }
  }
}
check();
