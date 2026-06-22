const { createClient } = require('@supabase/supabase-js');

const url = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const key1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc4MzYxNywiZXhwIjoyMDk3MzU5NjE3fQ.aOSm9cxZZ1K-mvMocrb1yg7i_M_-i4hja91SRgvsyVI';

async function test() {
  const supabase = createClient(url, key1);
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.log('List users failed:', error.message);
  } else {
    console.log('List users success! Count:', data.users.length);
  }
}

test();
