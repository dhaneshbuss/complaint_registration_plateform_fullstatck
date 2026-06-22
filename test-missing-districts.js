const { createClient } = require('@supabase/supabase-js');

require('./load_env');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const upDistricts = [
  "Agra", "Aligarh", "Prayagraj", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", 
  "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", 
  "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", 
  "Etawah", "Ayodhya", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", 
  "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", 
  "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", 
  "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", 
  "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", 
  "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", 
  "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
];

async function runTest() {
  try {
    const { data: districts, error } = await supabase.from('districts').select('district_name');
    
    if (error) {
      console.error(error);
      return;
    }
    
    const dbDistricts = districts.map(d => d.district_name.toLowerCase());
    
    const missing = upDistricts.filter(d => !dbDistricts.includes(d.toLowerCase()));
    
    console.log("Total rows in DB districts table:", dbDistricts.length);
    console.log("Missing Uttar Pradesh districts count:", missing.length);
    console.log("Missing districts:");
    missing.forEach(d => console.log(" - " + d));
    
  } catch (error) {
    console.error(error);
  }
}

runTest();
