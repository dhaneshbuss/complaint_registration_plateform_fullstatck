const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment configurations
const envPath = path.join(__dirname, '..', '..', '..', '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  try {
    envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  } catch (err) {
    console.error("Could not read .env.local file. Proceeding with empty env.", err);
  }
}

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// List of 47 major districts with realistic police stations in UP
const districtsData = {
  'Lucknow': ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Chowk', 'Indiranagar', 'Mahanagar'],
  'Kanpur Nagar': ['Kalyanpur', 'Swaroop Nagar', 'Barra', 'Chakeri', 'Nawabganj', 'Kakadev'],
  'Kanpur Dehat': ['Akbarpur', 'Rura', 'Rasoolabad', 'Sikandra', 'Derapur'],
  'Prayagraj': ['Civil Lines', 'Katra', 'Daraganj', 'Naini', 'Georgetown', 'Colonelganj'],
  'Varanasi': ['Lanka', 'Dashashwamedh', 'Cantonment', 'Sigra', 'Chetganj', 'Bhelupur'],
  'Agra': ['Hari Parvat', 'Tajganj', 'Sadar', 'Lohamandi', 'Rakabganj'],
  'Meerut': ['Civil Lines', 'Sadar', 'Medical', 'Pallavpuram', 'Kankerkhera'],
  'Ghaziabad': ['Indirapuram', 'Kavi Nagar', 'Sahibabad', 'Loni', 'Link Road'],
  'Gautam Buddha Nagar (Noida)': ['Sector 39', 'Sector 58', 'Sector 20', 'Sector 126', 'Knowledge Park', 'Surajpur'],
  'Gorakhpur': ['Cantt', 'Kotwali', 'Gorakhnath', 'Shahpur', 'Ramgarhtal'],
  'Bareilly': ['Prem Nagar', 'Izzatnagar', 'Baradari', 'Cantt', 'Kotwali'],
  'Jhansi': ['Nawabad', 'Sipri Bazar', 'Sadar', 'Premnagar'],
  'Aligarh': ['Civil Lines', 'Kwarsi', 'Bannadevi', 'Gandhi Park'],
  'Moradabad': ['Civil Lines', 'Katghar', 'Majhola', 'Galshaheed'],
  'Saharanpur': ['Janakpuri', 'Sadar Bazar', 'Kotwali', 'Kutubsher'],
  'Ayodhya': ['Kotwali Ayodhya', 'Cantt', 'Rudauli', 'Inayat Nagar'],
  'Sultanpur': ['Kotwali Sultanpur', 'Kurebhar', 'Kadipur', 'Jaisinghpur'],
  'Raebareli': ['Kotwali Raebareli', 'Lalganj', 'Bachhrawan', 'Salon'],
  'Unnao': ['Kotwali Unnao', 'Gangaghat', 'Safipur', 'Purwa'],
  'Sitapur': ['Kotwali Sitapur', 'Khairabad', 'Laharpur', 'Sidhauli'],
  'Lakhimpur Kheri': ['Kotwali Kheri', 'Palia', 'Nighasan', 'Mohammadi'],
  'Hardoi': ['Kotwali Hardoi', 'Shahabad', 'Sandila', 'Bilgram'],
  'Basti': ['Kotwali Basti', 'Harraiya', 'Kalwari', 'Lalganj'],
  'Gonda': ['Kotwali Gonda', 'Colonelganj', 'Mankapur', 'Tarabganj'],
  'Bahraich': ['Kotwali Bahraich', 'Jarwal Road', 'Nanpara', 'Kaiserganj'],
  'Balrampur': ['Kotwali Balrampur', 'Tulsipur', 'Utraula'],
  'Azamgarh': ['Kotwali Azamgarh', 'Sidhari', 'Mubarakpur', 'Phulpur'],
  'Mau': ['Kotwali Mau', 'Kopaganj', 'Ghosi', 'Muhammadabad'],
  'Ballia': ['Kotwali Ballia', 'Rasra', 'Bairia', 'Bansdih'],
  'Jaunpur': ['Kotwali Jaunpur', 'Line Bazar', 'Shahganj', 'Machhlishahr'],
  'Ghazipur': ['Kotwali Ghazipur', 'Saidpur', 'Zamania', 'Mohammadabad'],
  'Mirzapur': ['Kotwali Mirzapur', 'Vindhyachal', 'Chunar', 'Lalganj'],
  'Sonbhadra': ['Robertsganj', 'Obra', 'Pipri', 'Chopan'],
  'Chitrakoot': ['Kotwali Karwi', 'Mau', 'Rajapur', 'Manikpur'],
  'Banda': ['Kotwali Banda', 'Baberu', 'Atarra', 'Naraini'],
  'Hamirpur': ['Kotwali Hamirpur', 'Maudaha', 'Rath', 'Kurara'],
  'Etawah': ['Kotwali Etawah', 'Civil Lines', 'Bharthana', 'Jaswantnagar'],
  'Mainpuri': ['Kotwali Mainpuri', 'Karhal', 'Bhongaon', 'Kishni'],
  'Firozabad': ['South', 'North', 'Shikohabad', 'Tundla'],
  'Mathura': ['Kotwali Mathura', 'Highway', 'Vrindavan', 'Govind Nagar'],
  'Hathras': ['Kotwali Hathras', 'Sadabad', 'Sikandra Rao', 'Sasni'],
  'Kasganj': ['Kotwali Kasganj', 'Ganjdundwara', 'Sahawar'],
  'Bijnor': ['Kotwali Bijnor', 'Najibabad', 'Dhampur', 'Chandpur'],
  'Muzaffarnagar': ['Civil Lines', 'Kotwali', 'Nai Mandi', 'Khatauli'],
  'Shamli': ['Kotwali Shamli', 'Thana Bhawan', 'Kairana'],
  'Amroha': ['Kotwali Amroha', 'Gajraula', 'Hasanpur'],
  'Sambhal': ['Kotwali Sambhal', 'Chandausi', 'Bahjoi']
};

const firstNames = ['Amit', 'Sunil', 'Vijay', 'Rajesh', 'Sanjay', 'Ramesh', 'Rakesh', 'Anil', 'Deepak', 'Suresh', 'Pooja', 'Neha', 'Arti', 'Kiran', 'Sita', 'Rita', 'Sunita', 'Karan', 'Kshitij', 'Vikram', 'Meera', 'Savita', 'Rahul', 'Rohan', 'Kunal', 'Manish', 'Preeti', 'Jyoti', 'Shyam', 'Gopal', 'Arvind', 'Pankaj', 'Abhishek', 'Vikas', 'Dinesh', 'Ajay', 'Shweta', 'Rashmi', 'Kavita', 'Suman'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Yadav', 'Mishra', 'Tiwari', 'Pandey', 'Rawat', 'Aditya', 'Sen', 'Kumar', 'Joshi', 'Prasad', 'Rani', 'Devi', 'Saxena', 'Johar', 'Choudhary', 'Dubey', 'Tripathi', 'Shukla', 'Pathak', 'Rao', 'Vats', 'Bhatt', 'Ojha', 'Maurya'];

// Target Distributions (Must total exactly 1500)
const totalRecords = 1500;

const categoryDistribution = {
  'Cyber Crime': 300,
  'Women Safety': 250,
  'Child Safety': 150,
  'Financial Fraud': 250,
  'Law & Order': 200,
  'Missing Person': 100,
  'Land Dispute': 150,
  'Domestic Violence': 100
};

const statusDistribution = {
  'Pending': 525,             // 35%
  'In Progress': 375,         // 25%
  'Escalated': 150,           // 10%
  'Resolved': 300,            // 20%
  'Closed': 150               // 10%
};

const priorityDistribution = {
  'Low': 300,                 // 20%
  'Medium': 600,              // 40%
  'High': 375,                // 25%
  'Critical': 225             // 15%
};

// Shuffling helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate pool arrays to ensure mathematically exact distributions
const categoryPool = [];
Object.entries(categoryDistribution).forEach(([cat, count]) => {
  for (let i = 0; i < count; i++) categoryPool.push(cat);
});
shuffle(categoryPool);

const statusPool = [];
Object.entries(statusDistribution).forEach(([stat, count]) => {
  for (let i = 0; i < count; i++) statusPool.push(stat);
});
shuffle(statusPool);

const priorityPool = [];
Object.entries(priorityDistribution).forEach(([pri, count]) => {
  for (let i = 0; i < count; i++) priorityPool.push(pri);
});
shuffle(priorityPool);

// Descriptions Templates to compile 50-120 words descriptions
const descriptionParts = {
  'Cyber Crime': {
    openings: [
      "I am filing this formal complaint to report a serious cyber security incident that occurred recently involving my personal checking account.",
      "This is to bring to your immediate attention an online extortion and hacking event that has targeted my digital credentials.",
      "I wish to report a malicious scam where unidentified hackers gained unauthorized entry into my mobile device and primary email accounts."
    ],
    details: [
      "The perpetrator contacted me via a masked VOIP telephone call claiming to be an administrator from the bank head office. They convinced me to share a critical verification PIN sent to my handset and within minutes, multiple transactions were triggered withdrawing 78,000 INR from my account.",
      "They sent me a suspicious URL link on my social media account claiming I had won a lottery prize. Upon clicking the link, my browser cookies and saved passwords were leaked, and the scammers took full control of my identity profiles.",
      "The blackmailers are demanding a payment of 1,50,000 INR. They claim they have downloaded private images and documents from my cloud folder and threat to leak them publicly to my list of contacts if I do not transfer the funds."
    ],
    closings: [
      "I have attached the screenshot of the bank transfer SMS and the extortion message logs. Please lock the destination UPI identifiers, trace the registration cell towers, and register an FIR under relevant cyber law sections immediately.",
      "This has caused immense mental trauma and financial distress. I request the cyber cell units to track the IP addresses, freeze the recipient banks, and help retrieve my compromised profile files as fast as possible.",
      "I am ready to cooperate with the investigating unit and provide any device logs. Kindly secure the transaction footprints, report the scam number to telecom authorities, and initiate dynamic legal measures against the culprits."
    ]
  },
  'Women Safety': {
    openings: [
      "I am writing this complaint with deep distress regarding regular harassment and safety threats I have been facing on my daily route.",
      "This is to register an urgent report about safety intimidation and stalking incidents that are happening near my place of residence.",
      "I want to draw your attention to a persistent stalking and eve-teasing concern that has made it extremely unsafe for me to commute."
    ],
    details: [
      "A group of 3-4 bike-borne youths regularly follow me when I commute back from my tuition classes around 7 PM near the junction crossing. They pass highly vulgar comments, make threatening gestures, and block my path, which causes me extreme fear.",
      "An unknown individual has been following me from the metro station to my housing society gate every evening. He maintains a close distance, stares constantly, and has twice tried to approach me under the pretext of asking for coordinates.",
      "A local resident has been continuously tracking my movements and standing outside my office gate during my log-off hours. He has also been sending unsolicited messages on my social media profiles despite being blocked multiple times."
    ],
    closings: [
      "I feel extremely vulnerable and scared for my physical safety. Please deploy local patrol units near the crossing area in the evenings, review public CCTV recordings, and take strict action against the stalkers.",
      "I request the local police station to station a patrol vehicle during block hours, identify the suspects using bike registration plates, and register a formal FIR to prevent any severe incident.",
      "This harassment is affecting my work and mental health. I urge the station officer to summon the suspect, warn them under lawful provisions, and increase visible police presence in the sector block."
    ]
  },
  'Child Safety': {
    openings: [
      "I want to file a complaint regarding a severe threat to child safety and security occurring near the public playground area.",
      "This is to report an incident of exploitation and physical endangerment of minor school children that needs quick police intervention.",
      "I am writing to report a suspicious incident involving minors near the block elementary school complex."
    ],
    details: [
      "A local commercial establishment is employing minor children under the age of 14 for heavy labor and manual cleaning work. The children are kept in unhygienic conditions, worked for 12 hours daily, and subjected to physical threats and abuse.",
      "A private school van operator has been carrying double the allowed capacity of children. The driver drives extremely recklessly, regularly talks on the phone while driving, and leaves the young children unsupervised inside the vehicle.",
      "An unidentified vehicle has been repeatedly parking near the school gates during dismissal hours. The driver has been seen offering sweets and asking children to get in, which has generated severe panic among local parents."
    ],
    closings: [
      "I request the child welfare police units to conduct a surprise inspection at the site, rescue the minor children, and take strict action against the owner.",
      "Please review the vehicle logs, inspect the driver's license parameters, and instruct the school management to audit transport safety guidelines immediately.",
      "We request increased security pickets around the school premises during opening and closing hours to ensure safety. Kindly trace the vehicle registration plate."
    ]
  },
  'Financial Fraud': {
    openings: [
      "I wish to report a financial fraud scheme where I was duped of my lifetime savings by an unauthorized investment company.",
      "This complaint is being filed to report a fraudulent banking operation and misrepresentation that has resulted in massive monetary loss.",
      "I am writing to report a corporate scam involving a fake real-estate developer who took money under false pretenses."
    ],
    details: [
      "The company representatives approached me at my residence promising double returns in 12 months under a government-approved scheme. I invested 3,50,000 INR in their deposit portfolio, but when the maturity date arrived, their office was locked and the managers had fled.",
      "I received an email claiming my credit card rewards were expiring and needed activation. The link directed me to a clone page where I input my details, leading to an unauthorized cash withdrawal of 95,000 INR from my banking portal.",
      "A fake real estate agent sold me a residential plot using forged ownership titles and dummy land registry papers. I paid a booking amount of 5 Lakhs only to find out later that the land belongs to the state forest division."
    ],
    closings: [
      "I request the financial crime division to freeze the recipient bank accounts, trace the directors' phone logs, and recover my hard-earned savings.",
      "I have attached the transaction slips, receipt files, and broker emails. Please register an FIR under section 420 of IPC and trace the bank branches.",
      "Kindly launch an inquiry against the agency, review their registration records, and coordinates with cyber cells to freeze the active UPI accounts."
    ]
  },
  'Law & Order': {
    openings: [
      "I am reporting a regular public nuisance and law violation occurring in our sector that is disturbing public peace.",
      "This is to bring to your notice a severe clash and anti-social gathering happening near the local marketplace block.",
      "I wish to report an illegal activity involving weapons and unauthorized blockades in our residential ward."
    ],
    details: [
      "A group of anti-social elements regularly gathers near the corner public park late at night. They consume alcohol in the open, play high-volume music past midnight, and engage in loud verbal fights, threatening anyone who asks them to leave.",
      "A major dispute erupted between two local groups over street vendors' spots. The clash turned violent with stone-pelting, causing panic in the market. Several shops were forced to close and residents are scared to step out.",
      "Some local goons have set up an illegal toll collection barrier on the bypass road. They are stop trucks and commercial vehicles, demanding cash forcibly, and using sticks and weapons to threaten drivers who refuse to pay."
    ],
    closings: [
      "I request the local police station to send a night patrol team regularly, disperse these anti-social groups, and lock up the repeat offenders.",
      "Please deploy a static police picket in the market to restore order, arrest the main instigators, and ensure the safety of shopkeepers.",
      "We urge the circle officer to conduct a raid at the barrier location, secure the weapons, and register a case under the Arms Act and extortion sections."
    ]
  },
  'Missing Person': {
    openings: [
      "I am writing to file an urgent missing person report for my family member who has not returned home since yesterday.",
      "This is to report that my teenage son has gone missing under suspicious circumstances, and we are unable to contact him.",
      "I want to report the disappearance of my elderly father who left home this morning and has not returned."
    ],
    details: [
      "My 24-year-old brother left for his office in the industrial area at 9 AM yesterday. He did not return in the evening, and his mobile phone is currently switched off. We have checked with all his friends, colleagues, and local hospitals but found no trace.",
      "My 16-year-old daughter left home for her school classes around 8 AM. The school administration confirmed she did not attend her lectures. She has not returned home and left a note suggesting she was under immense exam stress.",
      "My 70-year-old grandfather, who suffers from severe Alzheimer's and memory loss, went out for a morning walk at 6 AM. He is wearing a blue shirt and cannot remember his residential address. He has no phone or ID card with him."
    ],
    closings: [
      "I request you to issue a statewide alert notice, check nearby railway and bus terminals, and help us find him. He was wearing a red shirt.",
      "Please broadcast her description to adjacent police stations, trace her mobile tower location logs, and register a missing child FIR immediately.",
      "We are extremely worried about his health and safety. Please share his photo on the police network and check the local CCTV camera feeds."
    ]
  },
  'Land Dispute': {
    openings: [
      "I want to report a serious land dispute and illegal occupation of my ancestral property by local developers.",
      "This is to bring to your notice a boundary encroachment and property destruction incident done by my neighbor.",
      "I wish to file a complaint regarding fraudulent land registry transactions and threats to seize my farm plot."
    ],
    details: [
      "Some local builders have forcefully entered my agricultural land with heavy machinery and started digging. They claim they have bought the land from a relative, but the official registry records list me as the sole owner. They threatened me with weapons when I objected.",
      "My neighbor has demolished the common boundary wall and started constructing a shop on my side of the residential plot. He is using local muscle power to intimidate my family, and has blocked our drainage pipes deliberately.",
      "A group of fraudsters has created fake power of attorney papers for my ancestral shop. They are trying to sell the property to third parties and have locked the main entrance, preventing my tenants from entering."
    ],
    closings: [
      "I request the sub-divisional magistrate and police to order a halt to the illegal construction, verify registry papers, and provide security.",
      "Please dispatch a police team to the spot to prevent any physical violence, restore the boundary alignment, and register our FIR.",
      "Kindly initiate a circle officer inquiry, inspect the land records registry, and file a case against the fraudsters under land grabbing laws."
    ]
  },
  'Domestic Violence': {
    openings: [
      "I am writing this complaint to report severe physical assault and dowry harassment by my husband and in-laws.",
      "This is to register an urgent complaint regarding domestic abuse and confinement happening in my neighborhood.",
      "I wish to report a case of domestic violence and life-threatening assault on a woman in our residential block."
    ],
    details: [
      "My husband and his parents have been beating me regularly for the last six months demanding 3 Lakhs cash and a car. Yesterday, they locked me in the storage room without food and threatened to burn me if my family did not pay.",
      "A woman in our building is being subjected to daily physical torture by her husband. We can hear her screams late at night. Today, she was thrown out of the house with severe bruises on her face and hands and needs immediate medical checkup.",
      "My brother-in-law has been physically abusing his elderly parents and forcing them to sign property transfer papers. He has cut off their electricity connection and beats them if they talk to other family members."
    ],
    closings: [
      "I request you to file an FIR under section 498A, provide me physical protection, and arrest my husband and in-laws immediately.",
      "Please dispatch a women's helpline unit to rescue the victim, record her statement, and initiate strict legal action against the husband.",
      "Kindly intervene immediately to protect the elderly parents, file a domestic violence report, and secure their medical evaluations."
    ]
  }
};

const actionMap = {
  'Cyber Crime': 'Freeze destination transaction accounts, request IP registry lookup from server, and file notice to telecom operators.',
  'Women Safety': 'Review surrounding street surveillance footage, dispatch emergency mobile patrol units, and secure local witness statements.',
  'Child Safety': 'Form a dedicated minor search team, coordinate with regional transport terminals, and broadcast child safety alerts.',
  'Land Dispute': 'Request revenue registry documents, order local land demarcation survey, and issue static security pickets.',
  'Financial Fraud': 'Notify bank authorities for account freezing, file notice under section 420, and trace transaction flow logs.',
  'Law & Order': 'Deploy localized riot control pickets, conduct search warrants, and arrest primary instigators.',
  'Missing Person': 'Publish alert notifications across border districts, cross-verify travel terminals, and check local hospital registries.',
  'Domestic Violence': 'Provide immediate physical security, file regular domestic violence reports, and summon accused relatives.'
};

// Generate a random phone number that is mathematically unique
const usedPhones = new Set();
function generateUniquePhone() {
  let phone = '';
  do {
    phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return phone;
}

// Generate unique UUIDs
const usedUUIDs = new Set();
function generateUUID() {
  let uuid = '';
  do {
    uuid = crypto.randomUUID();
  } while (usedUUIDs.has(uuid));
  usedUUIDs.add(uuid);
  return uuid;
}

// Seeding profiles list to assign created_by
const officerIds = [
  '11111111-1111-1111-1111-111111111111', // Devendra SHO
  '22222222-2222-2222-2222-222222222222', // Rakesh CO
  '33333333-3333-3333-3333-333333333333', // Priyanka SP
  '44444444-4444-4444-4444-444444444444', // Rajeev DGP
  '55555555-5555-5555-5555-555555555555', // Amit SHO
  '66666666-6666-6666-6666-666666666666'  // Vikram SHO
];

function generate1500Complaints() {
  const complaints = [];
  const startNum = 100001;

  for (let i = 0; i < totalRecords; i++) {
    const id = generateUUID();
    const complaint_number = `UPP-2026-${startNum + i}`;
    
    // Choose district and matching station
    const district = Object.keys(districtsData)[i % Object.keys(districtsData).length];
    const station = districtsData[district][i % districtsData[district].length];

    // Pop category, status, and priority from the shuffled pools
    const category = categoryPool[i];
    const status = statusPool[i];
    const priority = priorityPool[i];

    // Build description
    const categoryTemplates = descriptionParts[category];
    const opening = categoryTemplates.openings[i % categoryTemplates.openings.length];
    const middle = categoryTemplates.details[i % categoryTemplates.details.length];
    const closing = categoryTemplates.closings[i % categoryTemplates.closings.length];
    const description = `${opening} ${middle} ${closing}`;

    // Citizen info
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    const complainant_name = `${fName} ${lName}`;
    const complainant_phone = generateUniquePhone();
    const complainant_email = `${fName.toLowerCase()}.${lName.toLowerCase()}${10 + (i % 90)}@gmail.com`;

    // Severity based on category & priority logic
    let ai_severity_score = 5;
    if (priority === 'Critical') {
      ai_severity_score = Math.floor(9 + Math.random() * 2); // 9-10
    } else if (priority === 'High') {
      ai_severity_score = Math.floor(7 + Math.random() * 2); // 7-8
    } else if (priority === 'Medium') {
      ai_severity_score = Math.floor(4 + Math.random() * 3); // 4-6
    } else {
      ai_severity_score = Math.floor(1 + Math.random() * 3); // 1-3
    }
    ai_severity_score = Math.max(1, Math.min(10, ai_severity_score));

    // Uniform date generation between Jan 1, 2026 and June 30, 2026
    const startTimestamp = 1767225600000; // 2026-01-01T00:00:00Z
    const endTimestamp = 1782864000000;   // 2026-06-30T00:00:00Z
    const randomTimestamp = startTimestamp + Math.floor(Math.random() * (endTimestamp - startTimestamp));
    const created_at = new Date(randomTimestamp).toISOString();

    const created_by = officerIds[i % officerIds.length];
    const assigned_officer_id = status !== 'Pending' ? officerIds[(i + 2) % officerIds.length] : null;

    complaints.push({
      id,
      complaint_number,
      complainant_name,
      complainant_phone,
      complainant_email,
      description,
      category,
      ai_predicted_category: category,
      ai_severity_score,
      ai_recommended_action: actionMap[category],
      priority,
      status,
      district,
      station,
      assigned_officer_id,
      created_by,
      created_at,
      updated_at: created_at
    });
  }

  return complaints;
}

function writeSQLFile(complaints) {
  const migrationsDir = path.join(__dirname, '..', '..', '..', 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const sqlFilePath = path.join(migrationsDir, '20260619000000_seed_1500.sql');
  console.log(`Writing SQL statements to ${sqlFilePath}...`);

  let sqlContent = `-- Seed 1500 UP Police complaints\n`;
  sqlContent += `TRUNCATE public.complaints CASCADE;\n\n`;

  // Write in chunks of 50 to optimize query parsing and avoid maximum query size limits
  const chunkSize = 50;
  for (let i = 0; i < complaints.length; i += chunkSize) {
    const chunk = complaints.slice(i, i + chunkSize);
    sqlContent += `INSERT INTO public.complaints (\n`;
    sqlContent += `  id, complaint_number, complainant_name, complainant_phone, complainant_email,\n`;
    sqlContent += `  description, category, ai_predicted_category, ai_severity_score, ai_recommended_action,\n`;
    sqlContent += `  priority, status, district, station, assigned_officer_id, created_by, created_at, updated_at\n`;
    sqlContent += `) VALUES\n`;

    const valuesStr = chunk.map(c => {
      const escape = (str) => str ? str.replace(/'/g, "''") : null;
      const valOrNull = (v) => v === null ? 'NULL' : `'${escape(v)}'`;
      const valOrNullRaw = (v) => v === null ? 'NULL' : `'${v}'`;

      return `(\n` +
        `  '${c.id}',\n` +
        `  '${c.complaint_number}',\n` +
        `  ${valOrNull(c.complainant_name)},\n` +
        `  '${c.complainant_phone}',\n` +
        `  ${valOrNull(c.complainant_email)},\n` +
        `  ${valOrNull(c.description)},\n` +
        `  '${c.category}',\n` +
        `  '${c.ai_predicted_category}',\n` +
        `  ${c.ai_severity_score},\n` +
        `  ${valOrNull(c.ai_recommended_action)},\n` +
        `  '${c.priority}',\n` +
        `  '${c.status}',\n` +
        `  ${valOrNull(c.district)},\n` +
        `  ${valOrNull(c.station)},\n` +
        `  ${c.assigned_officer_id ? `'${c.assigned_officer_id}'` : 'NULL'},\n` +
        `  '${c.created_by}',\n` +
        `  '${c.created_at}',\n` +
        `  '${c.updated_at}'\n` +
        `)`;
    }).join(',\n');

    sqlContent += valuesStr + ';\n\n';
  }

  fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
  console.log("SQL seed file successfully created.");
  return sqlFilePath;
}

async function uploadToSupabase(complaints) {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url') {
    console.log("Supabase URL/Key missing. Skipping database upload, SQL file is written.");
    return;
  }

  console.log("Connecting to live Supabase...");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Clearing existing complaints in live database...");
  const { error: truncError } = await supabase.from('complaints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (truncError) {
    console.error("Warning: Error clearing live complaints table:", truncError.message);
  } else {
    console.log("Live complaints table cleared.");
  }

  const batchSize = 50;
  console.log(`Uploading 1500 complaints in batches of ${batchSize} to live Supabase database...`);

  for (let i = 0; i < complaints.length; i += batchSize) {
    const batch = complaints.slice(i, i + batchSize);
    
    // Upload batch
    const { error } = await supabase.from('complaints').insert(batch);
    if (error) {
      console.error(`Error uploading batch ${i / batchSize + 1}:`, error.message, error);
      console.log("Stopping upload. Fix the database constraints or schemas first.");
      process.exit(1);
    } else {
      console.log(`Uploaded batch ${i / batchSize + 1} / ${complaints.length / batchSize} successfully.`);
    }
  }

  console.log("Live Supabase database upload complete!");
}

function main() {
  const complaints = generate1500Complaints();
  
  // Verify distributions
  console.log("\n--- Verification of Distributions ---");
  const catCounts = {};
  const statusCounts = {};
  const priorityCounts = {};
  complaints.forEach(c => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
  });
  console.log("Categories:", catCounts);
  console.log("Statuses:", statusCounts);
  console.log("Priorities:", priorityCounts);
  console.log("Total Count:", complaints.length);
  console.log("-------------------------------------\n");

  writeSQLFile(complaints);
  uploadToSupabase(complaints);
}

main();
