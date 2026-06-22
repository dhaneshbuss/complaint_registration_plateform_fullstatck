const { createClient } = require('@supabase/supabase-js');

const url = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const key1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc4MzYxNywiZXhwIjoyMDk3MzU5NjE3fQ.aOSm9cxZZ1K-mvMocrb1yg7i_M_-i4hja91SRgvsyVI';
const key2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc4MzYxNywiZXhwIjoyMDk3MzU5NjE3fQ.aOSm9cxZZ1K-mvMocrb1yg7i_M_-i4hja91SRgvsyVIsb_secret_Tz72DGRBYhmlcv8_Mb3OBg_ZmQ6wd-r';

async function test(key, name) {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('police_stations').select('id').limit(1);
  if (error) {
    console.log(name, 'failed:', error.message);
  } else {
    console.log(name, 'success:', data);
  }
}

async function run() {
  await test(key1, 'Key 1 (Truncated)');
  await test(key2, 'Key 2 (From .env.local)');
}

run();
