const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qexxykfjmgfnjeluaehg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleHh5a2ZqbWdmbmplbHVhZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODM2MTcsImV4cCI6MjA5NzM1OTYxN30.0OfW9Z8EuJAOCMbW1CRAMdOiio5TuVzsGmnC6OUjpxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const { data } = await supabase.from('districts').select('*').limit(1);
  console.log(data);
}
runTest();
