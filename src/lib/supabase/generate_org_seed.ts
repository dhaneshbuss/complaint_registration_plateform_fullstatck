import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Load environment configurations
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Could not read .env.local file. Proceeding with empty env.", e);
}

const getEnvVar = (name: string): string => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Major Uttar Pradesh Districts with Codes, Ranges, and Zones
interface DistrictSeed {
  id: string;
  name: string;
  range: string;
  zone: string;
  code: string;
}

const DISTRICTS_DATA: Omit<DistrictSeed, 'id'>[] = [
  // Lucknow Zone
  { name: 'Lucknow', range: 'Lucknow Range', zone: 'Lucknow Zone', code: 'LKO' },
  { name: 'Unnao', range: 'Lucknow Range', zone: 'Lucknow Zone', code: 'UNA' },
  { name: 'Sitapur', range: 'Lucknow Range', zone: 'Lucknow Zone', code: 'STP' },
  { name: 'Hardoi', range: 'Lucknow Range', zone: 'Lucknow Zone', code: 'HRD' },
  { name: 'Lakhimpur Kheri', range: 'Lucknow Range', zone: 'Lucknow Zone', code: 'LMP' },
  { name: 'Raebareli', range: 'Lucknow Range', zone: 'Lucknow Zone', code: 'RBL' },
  { name: 'Ayodhya', range: 'Ayodhya Range', zone: 'Lucknow Zone', code: 'AYD' },
  { name: 'Barabanki', range: 'Ayodhya Range', zone: 'Lucknow Zone', code: 'BBK' },
  { name: 'Sultanpur', range: 'Ayodhya Range', zone: 'Lucknow Zone', code: 'SLN' },
  { name: 'Amethi', range: 'Ayodhya Range', zone: 'Lucknow Zone', code: 'AMT' },
  
  // Bareilly Zone
  { name: 'Bareilly', range: 'Bareilly Range', zone: 'Bareilly Zone', code: 'BLY' },
  { name: 'Budaun', range: 'Bareilly Range', zone: 'Bareilly Zone', code: 'BDN' },
  { name: 'Pilibhit', range: 'Bareilly Range', zone: 'Bareilly Zone', code: 'PBT' },
  { name: 'Shahjahanpur', range: 'Bareilly Range', zone: 'Bareilly Zone', code: 'SJP' },
  { name: 'Moradabad', range: 'Moradabad Range', zone: 'Bareilly Zone', code: 'MBD' },
  { name: 'Bijnor', range: 'Moradabad Range', zone: 'Bareilly Zone', code: 'BJR' },
  { name: 'Rampur', range: 'Moradabad Range', zone: 'Bareilly Zone', code: 'RMP' },
  
  // Meerut Zone
  { name: 'Meerut', range: 'Meerut Range', zone: 'Meerut Zone', code: 'MRT' },
  { name: 'Ghaziabad', range: 'Meerut Range', zone: 'Meerut Zone', code: 'GZB' },
  { name: 'Noida', range: 'Meerut Range', zone: 'Meerut Zone', code: 'NDA' }, // Noida used for GB Nagar compatibility
  { name: 'Bulandshahr', range: 'Meerut Range', zone: 'Meerut Zone', code: 'BSR' },
  { name: 'Saharanpur', range: 'Saharanpur Range', zone: 'Meerut Zone', code: 'SRE' },
  { name: 'Muzaffarnagar', range: 'Saharanpur Range', zone: 'Meerut Zone', code: 'MZN' },
  { name: 'Shamli', range: 'Saharanpur Range', zone: 'Meerut Zone', code: 'SML' },
  { name: 'Aligarh', range: 'Aligarh Range', zone: 'Meerut Zone', code: 'ALG' },
  { name: 'Hathras', range: 'Aligarh Range', zone: 'Meerut Zone', code: 'HTS' },
  
  // Agra Zone
  { name: 'Agra', range: 'Agra Range', zone: 'Agra Zone', code: 'AGR' },
  { name: 'Mathura', range: 'Agra Range', zone: 'Agra Zone', code: 'MTR' },
  { name: 'Firozabad', range: 'Agra Range', zone: 'Agra Zone', code: 'FZD' },
  { name: 'Mainpuri', range: 'Agra Range', zone: 'Agra Zone', code: 'MNP' },
  
  // Kanpur Zone
  { name: 'Kanpur', range: 'Kanpur Range', zone: 'Kanpur Zone', code: 'KNP' }, // Kanpur used for Kanpur Nagar compatibility
  { name: 'Kanpur Dehat', range: 'Kanpur Range', zone: 'Kanpur Zone', code: 'KPD' },
  { name: 'Etawah', range: 'Kanpur Range', zone: 'Kanpur Zone', code: 'ETW' },
  { name: 'Kannauj', range: 'Kanpur Range', zone: 'Kanpur Zone', code: 'KNJ' },
  { name: 'Jhansi', range: 'Jhansi Range', zone: 'Kanpur Zone', code: 'JHS' },
  { name: 'Jalaun', range: 'Jhansi Range', zone: 'Kanpur Zone', code: 'JLN' },
  
  // Prayagraj Zone
  { name: 'Prayagraj', range: 'Prayagraj Range', zone: 'Prayagraj Zone', code: 'PRG' },
  { name: 'Fatehpur', range: 'Prayagraj Range', zone: 'Prayagraj Zone', code: 'FTP' },
  { name: 'Pratapgarh', range: 'Prayagraj Range', zone: 'Prayagraj Zone', code: 'PTG' },
  { name: 'Chitrakoot', range: 'Chitrakoot Range', zone: 'Prayagraj Zone', code: 'CKT' },
  { name: 'Banda', range: 'Chitrakoot Range', zone: 'Prayagraj Zone', code: 'BND' },
  { name: 'Hamirpur', range: 'Chitrakoot Range', zone: 'Prayagraj Zone', code: 'HMR' },
  
  // Varanasi Zone
  { name: 'Varanasi', range: 'Varanasi Range', zone: 'Varanasi Zone', code: 'VNS' },
  { name: 'Jaunpur', range: 'Varanasi Range', zone: 'Varanasi Zone', code: 'JNP' },
  { name: 'Ghazipur', range: 'Varanasi Range', zone: 'Varanasi Zone', code: 'GZP' },
  { name: 'Mirzapur', range: 'Mirzapur Range', zone: 'Varanasi Zone', code: 'MZP' },
  { name: 'Sonbhadra', range: 'Mirzapur Range', zone: 'Varanasi Zone', code: 'SND' },
  { name: 'Azamgarh', range: 'Azamgarh Range', zone: 'Varanasi Zone', code: 'AZM' },
  { name: 'Mau', range: 'Azamgarh Range', zone: 'Varanasi Zone', code: 'MAU' },
  { name: 'Ballia', range: 'Azamgarh Range', zone: 'Varanasi Zone', code: 'BAL' },
  
  // Gorakhpur Zone
  { name: 'Gorakhpur', range: 'Gorakhpur Range', zone: 'Gorakhpur Zone', code: 'GKP' },
  { name: 'Deoria', range: 'Gorakhpur Range', zone: 'Gorakhpur Zone', code: 'DEO' },
  { name: 'Basti', range: 'Basti Range', zone: 'Gorakhpur Zone', code: 'BST' },
  { name: 'Gonda', range: 'Devipatan Range', zone: 'Gorakhpur Zone', code: 'GND' },
  { name: 'Bahraich', range: 'Devipatan Range', zone: 'Gorakhpur Zone', code: 'BRC' }
];

// Major Station names per district for key districts
const MAJOR_STATIONS: Record<string, string[]> = {
  'Lucknow': ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Chowk', 'Indiranagar', 'Mahanagar', 'Alambagh', 'PGI', 'Chinhat', 'Vibhuti Khand'],
  'Kanpur': ['Kalyanpur', 'Swaroop Nagar', 'Barra', 'Chakeri', 'Nawabganj', 'Kakadev', 'Govind Nagar', 'Kidwai Nagar', 'Nazirabad', 'Naubasta'],
  'Prayagraj': ['Civil Lines', 'Katra', 'Daraganj', 'Naini', 'Georgetown', 'Colonelganj', 'Jhunsi', 'Phaphamau', 'Cantonment', 'Shahganj'],
  'Noida': ['Sector 20', 'Sector 24', 'Phase 2', 'Expressway', 'Sector 39', 'Sector 58', 'Sector 126', 'Knowledge Park', 'Surajpur', 'Ecotech 3'],
  'Varanasi': ['Lanka', 'Dashashwamedh', 'Cantonment', 'Sigra', 'Chetganj', 'Bhelupur', 'Adampur', 'Jaitpura', 'Kotwali Varanasi', 'Sarnath']
};

const firstNames = ['Amit', 'Sunil', 'Vijay', 'Rajesh', 'Sanjay', 'Ramesh', 'Rakesh', 'Anil', 'Deepak', 'Suresh', 'Pooja', 'Neha', 'Arti', 'Kiran', 'Sita', 'Rita', 'Sunita', 'Karan', 'Kshitij', 'Vikram', 'Meera', 'Savita', 'Rahul', 'Rohan', 'Kunal', 'Manish', 'Preeti', 'Jyoti', 'Shyam', 'Gopal', 'Arvind', 'Pankaj', 'Abhishek', 'Vikas', 'Dinesh', 'Ajay', 'Shweta', 'Rashmi', 'Kavita', 'Suman', 'Aditya', 'Alok', 'Anuj', 'Ashish', 'Brijesh', 'Chandra', 'Gaurav', 'Harish', 'Jitendra', 'Kamlesh', 'Manoj', 'Nitin', 'Pawan', 'Pradeep', 'Rajeev', 'Sandeep', 'Satish', 'Tarun', 'Umesh', 'Yogesh'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Yadav', 'Mishra', 'Tiwari', 'Pandey', 'Rawat', 'Aditya', 'Sen', 'Kumar', 'Joshi', 'Prasad', 'Rani', 'Devi', 'Saxena', 'Johar', 'Choudhary', 'Dubey', 'Tripathi', 'Shukla', 'Pathak', 'Rao', 'Vats', 'Bhatt', 'Ojha', 'Maurya', 'Dwivedi', 'Chaturvedi', 'Bajpai', 'Chauhan', 'Rathore', 'Solanki', 'Dixit', 'Saxena', 'Srivastava', 'Patel', 'Reddy', 'Giri', 'Puri'];

// Unique Seed Data Pools
const categories = ['Cyber Crime', 'Women Safety', 'Child Safety', 'Land Dispute', 'Financial Fraud', 'Law & Order', 'Missing Person', 'Domestic Violence'];
const statuses = ['Pending', 'Under Investigation', 'In Progress', 'Resolved', 'Escalated', 'Closed'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

// Generators
const usedPhones = new Set<string>();
function generateUniquePhone(): string {
  let phone = '';
  do {
    phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return phone;
}

const usedEmails = new Set<string>();
function generateUniqueEmail(first: string, last: string, id: number): string {
  let email = `${first.toLowerCase()}.${last.toLowerCase()}.${id}@uppolice.gov.in`;
  let counter = 1;
  while (usedEmails.has(email)) {
    email = `${first.toLowerCase()}.${last.toLowerCase()}.${id}_${counter}@uppolice.gov.in`;
    counter++;
  }
  usedEmails.add(email);
  return email;
}

const usedBelts = new Set<string>();
function generateUniqueBelt(distCode: string): string {
  let belt = '';
  do {
    belt = `UPP-${distCode}-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (usedBelts.has(belt));
  usedBelts.add(belt);
  return belt;
}

// Generate static / stable UUIDs deterministically based on seed string
function getDeterministicUUID(seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Format: 8-4-4-4-12
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

// Description templates for complaints
const descriptionParts: Record<string, { openings: string[]; details: string[]; closings: string[] }> = {
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

const actionMap: Record<string, string> = {
  'Cyber Crime': 'Freeze destination transaction accounts, request IP registry lookup from server, and file notice to telecom operators.',
  'Women Safety': 'Review surrounding street surveillance footage, dispatch emergency mobile patrol units, and secure local witness statements.',
  'Child Safety': 'Form a dedicated minor search team, coordinate with regional transport terminals, and broadcast child safety alerts.',
  'Land Dispute': 'Request revenue registry documents, order local land demarcation survey, and issue static security pickets.',
  'Financial Fraud': 'Notify bank authorities for account freezing, file notice under section 420, and trace transaction flow logs.',
  'Law & Order': 'Deploy localized riot control pickets, conduct search warrants, and arrest primary instigators.',
  'Missing Person': 'Publish alert notifications across border districts, cross-verify travel terminals, and check local hospital registries.',
  'Domestic Violence': 'Provide immediate physical security, file regular domestic violence reports, and summon accused relatives.'
};

function main() {
  console.log("Generating UP Police Seed Data...");

  const districts: DistrictSeed[] = [];
  const stations: { id: string; district_id: string; name: string; code: string; phone: string }[] = [];
  const officers: {
    id: string;
    name: string;
    rank: string;
    belt_number: string;
    mobile: string;
    email: string;
    district_id: string | null;
    station_id: string | null;
    role: string;
    status: string;
  }[] = [];

  const profiles: {
    id: string;
    full_name: string;
    badge_number: string;
    role: string;
    district: string;
    station: string;
  }[] = [];

  // Mappings for quick lookup
  const stationIOsMap = new Map<string, typeof officers>();
  const stationSHOMap = new Map<string, typeof officers[0]>();

  // 1. Generate Districts
  DISTRICTS_DATA.forEach((dist, idx) => {
    // Generate deterministic UUID for districts
    // For Lucknow, Noida, and Kanpur, use fixed UUID prefixes to coordinate with static mock profiles if needed
    let id = '';
    if (dist.name === 'Lucknow') id = '11111111-1111-1111-1111-111111111101';
    else if (dist.name === 'Noida') id = '11111111-1111-1111-1111-111111111102';
    else if (dist.name === 'Kanpur') id = '11111111-1111-1111-1111-111111111103';
    else id = getDeterministicUUID(`district_${dist.name}_${idx}`);

    districts.push({ id, ...dist });
  });

  // 2. Generate Police Stations
  districts.forEach((dist, distIdx) => {
    const stationNames = MAJOR_STATIONS[dist.name] || [
      `${dist.name} Kotwali`,
      `${dist.name} Civil Lines`,
      `${dist.name} Sadar`,
      `${dist.name} Bypass`,
      `${dist.name} Cantt`,
      `${dist.name} Dehat`,
      `${dist.name} Junction`,
      `${dist.name} North`,
      `${dist.name} South`
    ];

    stationNames.forEach((sName, sIdx) => {
      let id = '';
      if (dist.name === 'Lucknow' && sName === 'Hazratganj') {
        id = '11111111-2222-3333-4444-555555555551';
      } else if (dist.name === 'Noida' && sName === 'Sector 39') {
        id = '11111111-2222-3333-4444-555555555552';
      } else if (dist.name === 'Kanpur' && sName === 'Kalyanpur') {
        id = '11111111-2222-3333-4444-555555555553';
      } else {
        id = getDeterministicUUID(`station_${dist.name}_${sName}_${sIdx}`);
      }

      const code = `${dist.code}-${sName.substring(0, 3).toUpperCase()}-${100 + sIdx}`;
      const phone = `0522-${200000 + Math.floor(Math.random() * 800000)}`;

      stations.push({
        id,
        district_id: dist.id,
        name: sName,
        code,
        phone
      });
    });
  });

  // 3. Generate State Level Officers
  // 1 DGP
  const dgpName = "Rajeev Krishna";
  const dgpEmail = "rajeev.krishna@uppolice.gov.in";
  const dgpMobile = "9454400101";
  const dgpId = "44444444-4444-4444-4444-444444444444"; // Fixed static ID for DGP login
  officers.push({
    id: dgpId,
    name: dgpName,
    rank: "DGP / Director General",
    belt_number: "UP-000001",
    mobile: dgpMobile,
    email: dgpEmail,
    district_id: null,
    station_id: null,
    role: "DGP",
    status: "Active"
  });
  profiles.push({
    id: dgpId,
    full_name: dgpName,
    badge_number: "UP-000001",
    role: "DGP",
    district: "Lucknow",
    station: "Hazratganj"
  });

  // Zones: 8 ADG/IG (1 per Zone)
  const uniqueZones = Array.from(new Set(districts.map(d => d.zone)));
  uniqueZones.forEach((zone, zIdx) => {
    const fName = firstNames[zIdx % firstNames.length];
    const lName = lastNames[zIdx % lastNames.length];
    const name = `${fName} ${lName}`;
    const email = generateUniqueEmail(fName, lName, 900 + zIdx);
    const mobile = `945440020${zIdx}`;
    const id = getDeterministicUUID(`officer_adg_${zone}`);
    officers.push({
      id,
      name,
      rank: "ADG / Additional Director General",
      belt_number: `UP-ADG-${10 + zIdx}`,
      mobile,
      email,
      district_id: null,
      station_id: null,
      role: "ADG",
      status: "Active"
    });
  });

  // Ranges: 18 DIG/IG (1 per Range)
  const uniqueRanges = Array.from(new Set(districts.map(d => d.range)));
  uniqueRanges.forEach((range, rIdx) => {
    const fName = firstNames[(rIdx + 10) % firstNames.length];
    const lName = lastNames[(rIdx + 10) % lastNames.length];
    const name = `${fName} ${lName}`;
    const email = generateUniqueEmail(fName, lName, 800 + rIdx);
    const mobile = `945440030${rIdx % 10}`;
    const id = getDeterministicUUID(`officer_dig_${range}`);
    officers.push({
      id,
      name,
      rank: rIdx % 2 === 0 ? "IG / Inspector General" : "DIG / Deputy Inspector General",
      belt_number: `UP-DIG-${100 + rIdx}`,
      mobile,
      email,
      district_id: null,
      station_id: null,
      role: rIdx % 2 === 0 ? "IG" : "DIG",
      status: "Active"
    });
  });

  // District Level: 1 SP/SSP per district
  districts.forEach((dist, dIdx) => {
    let id = '';
    let name = '';
    let belt = '';
    
    if (dist.name === 'Noida') {
      id = '33333333-3333-3333-3333-333333333333'; // Fixed SP Noida login
      name = 'Priyanka Sen';
      belt = 'UP-204857';
    } else {
      id = getDeterministicUUID(`officer_sp_${dist.name}`);
      const fName = firstNames[(dIdx + 20) % firstNames.length];
      const lName = lastNames[(dIdx + 20) % lastNames.length];
      name = `${fName} ${lName}`;
      belt = generateUniqueBelt(dist.code);
    }
    
    const email = generateUniqueEmail(name.split(' ')[0], name.split(' ')[1], 700 + dIdx);
    const mobile = `945440${dIdx < 10 ? '0' + dIdx : dIdx}00`;

    officers.push({
      id,
      name,
      rank: dIdx % 3 === 0 ? "SSP / Senior Superintendent" : "SP / Superintendent",
      belt_number: belt,
      mobile,
      email,
      district_id: dist.id,
      station_id: null,
      role: "SSP/SP",
      status: "Active"
    });

    if (dist.name === 'Noida') {
      profiles.push({
        id,
        full_name: name,
        badge_number: belt,
        role: "SP",
        district: "Noida",
        station: "Sector 39"
      });
    }
  });

  // Circle Level: 3 COs per district
  districts.forEach((dist, dIdx) => {
    for (let cIdx = 0; cIdx < 3; cIdx++) {
      let id = '';
      let name = '';
      let belt = '';
      
      if (dist.name === 'Lucknow' && cIdx === 0) {
        id = '22222222-2222-2222-2222-222222222222'; // Fixed CO Lucknow login
        name = 'Rakesh Verma';
        belt = 'UP-930485';
      } else {
        id = getDeterministicUUID(`officer_co_${dist.name}_${cIdx}`);
        const fName = firstNames[(dIdx * 3 + cIdx + 100) % firstNames.length];
        const lName = lastNames[(dIdx * 3 + cIdx + 100) % lastNames.length];
        name = `${fName} ${lName}`;
        belt = generateUniqueBelt(dist.code);
      }

      const email = generateUniqueEmail(name.split(' ')[0], name.split(' ')[1], 600 + dIdx * 3 + cIdx);
      const mobile = `945440${dIdx < 10 ? '0' + dIdx : dIdx}5${cIdx}`;

      officers.push({
        id,
        name,
        rank: "CO / Circle Officer (DSP)",
        belt_number: belt,
        mobile,
        email,
        district_id: dist.id,
        station_id: null,
        role: "CO",
        status: "Active"
      });

      if (dist.name === 'Lucknow' && cIdx === 0) {
        profiles.push({
          id,
          full_name: name,
          badge_number: belt,
          role: "CO",
          district: "Lucknow",
          station: "Hazratganj"
        });
      }
    }
  });

  // Station Level: 1 SHO, 5 IOs, 10 Constables per Station
  let globalOfficerCounter = 1;
  stations.forEach((station, sIdx) => {
    const dist = districts.find(d => d.id === station.district_id)!;
    
    // Exactly 1 SHO per station
    let shoId = '';
    let shoName = '';
    let shoBelt = '';
    
    if (dist.name === 'Lucknow' && station.name === 'Hazratganj') {
      shoId = '11111111-1111-1111-1111-111111111111'; // Fixed SHO Lucknow Hazratganj
      shoName = 'Devendra Singh';
      shoBelt = 'UP-827461';
    } else if (dist.name === 'Noida' && station.name === 'Sector 39') {
      shoId = '55555555-5555-5555-5555-555555555555'; // Fixed SHO Noida Sector 39
      shoName = 'Amit Rawat';
      shoBelt = 'UP-746352';
    } else if (dist.name === 'Kanpur' && station.name === 'Kalyanpur') {
      shoId = '66666666-6666-6666-6666-666666666666'; // Fixed SHO Kanpur Kalyanpur
      shoName = 'Vikram Aditya';
      shoBelt = 'UP-583920';
    } else {
      shoId = getDeterministicUUID(`officer_sho_${dist.name}_${station.name}`);
      const fName = firstNames[globalOfficerCounter % firstNames.length];
      const lName = lastNames[globalOfficerCounter % lastNames.length];
      shoName = `${fName} ${lName}`;
      shoBelt = generateUniqueBelt(dist.code);
    }
    
    const shoEmail = generateUniqueEmail(shoName.split(' ')[0], shoName.split(' ')[1], 10000 + globalOfficerCounter);
    const shoMobile = generateUniquePhone();

    const shoObj = {
      id: shoId,
      name: shoName,
      rank: "Inspector",
      belt_number: shoBelt,
      mobile: shoMobile,
      email: shoEmail,
      district_id: dist.id,
      station_id: station.id,
      role: "SHO",
      status: "Active"
    };

    officers.push(shoObj);
    stationSHOMap.set(station.id, shoObj);

    if (dist.name === 'Lucknow' && station.name === 'Hazratganj') {
      profiles.push({ id: shoId, full_name: shoName, badge_number: shoBelt, role: "SHO", district: "Lucknow", station: "Hazratganj" });
    } else if (dist.name === 'Noida' && station.name === 'Sector 39') {
      profiles.push({ id: shoId, full_name: shoName, badge_number: shoBelt, role: "SHO", district: "Noida", station: "Sector 39" });
    } else if (dist.name === 'Kanpur' && station.name === 'Kalyanpur') {
      profiles.push({ id: shoId, full_name: shoName, badge_number: shoBelt, role: "SHO", district: "Kanpur", station: "Kalyanpur" });
    }

    globalOfficerCounter++;

    // 5 IOs per station (1 Cyber, 1 Women Help Desk, 1 Child Protection, 2 General SIs)
    const iosList: typeof officers = [];
    
    const specializations = [
      { spec: 'Cyber', rank: 'SI (Cyber Crime)' },
      { spec: 'Women', rank: 'SI (Women Help Desk)' },
      { spec: 'Child', rank: 'SI (Child Protection)' },
      { spec: 'General1', rank: 'Sub-Inspector' },
      { spec: 'General2', rank: 'Sub-Inspector' }
    ];

    specializations.forEach((sp, iIdx) => {
      const ioId = getDeterministicUUID(`officer_io_${dist.name}_${station.name}_${iIdx}`);
      const fName = firstNames[globalOfficerCounter % firstNames.length];
      const lName = lastNames[globalOfficerCounter % lastNames.length];
      const ioName = `${fName} ${lName}`;
      const ioBelt = generateUniqueBelt(dist.code);
      const ioEmail = generateUniqueEmail(fName, lName, 20000 + globalOfficerCounter);
      const ioMobile = generateUniquePhone();

      const ioObj = {
        id: ioId,
        name: ioName,
        rank: sp.rank,
        belt_number: ioBelt,
        mobile: ioMobile,
        email: ioEmail,
        district_id: dist.id,
        station_id: station.id,
        role: "IO",
        status: "Active"
      };

      officers.push(ioObj);
      iosList.push(ioObj);
      globalOfficerCounter++;
    });

    stationIOsMap.set(station.id, iosList);

    // 10 Constables per station
    for (let cIdx = 0; cIdx < 10; cIdx++) {
      const conId = getDeterministicUUID(`officer_con_${dist.name}_${station.name}_${cIdx}`);
      const fName = firstNames[globalOfficerCounter % firstNames.length];
      const lName = lastNames[globalOfficerCounter % lastNames.length];
      const conName = `${fName} ${lName}`;
      const conBelt = generateUniqueBelt(dist.code);
      const conEmail = generateUniqueEmail(fName, lName, 30000 + globalOfficerCounter);
      const conMobile = generateUniquePhone();

      officers.push({
        id: conId,
        name: conName,
        rank: "Constable",
        belt_number: conBelt,
        mobile: conMobile,
        email: conEmail,
        district_id: dist.id,
        station_id: station.id,
        role: "Constable",
        status: "Active"
      });
      globalOfficerCounter++;
    }
  });

  console.log(`Successfully generated metadata structures:`);
  console.log(`- Districts: ${districts.length}`);
  console.log(`- Stations: ${stations.length}`);
  console.log(`- Officers: ${officers.length}`);
  console.log(`- Profiles: ${profiles.length}`);

  // 4. Generate 1,500 complaints relationally mapped and obeying specialization rules
  const complaints: any[] = [];
  const totalComplaints = 1500;

  // Exact distribution weights matching generate_1500_complaints.js
  const categoryDistribution: Record<string, number> = {
    'Cyber Crime': 300,
    'Women Safety': 250,
    'Child Safety': 150,
    'Financial Fraud': 250,
    'Law & Order': 200,
    'Missing Person': 100,
    'Land Dispute': 150,
    'Domestic Violence': 100
  };

  const statusDistribution: Record<string, number> = {
    'Pending': 525,
    'In Progress': 375,
    'Escalated': 150,
    'Resolved': 300,
    'Closed': 150
  };

  const priorityDistribution: Record<string, number> = {
    'Low': 300,
    'Medium': 600,
    'High': 375,
    'Critical': 225
  };

  function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  const categoryPool: string[] = [];
  Object.entries(categoryDistribution).forEach(([cat, count]) => {
    for (let i = 0; i < count; i++) categoryPool.push(cat);
  });
  shuffle(categoryPool);

  const statusPool: string[] = [];
  Object.entries(statusDistribution).forEach(([stat, count]) => {
    for (let i = 0; i < count; i++) statusPool.push(stat);
  });
  shuffle(statusPool);

  const priorityPool: string[] = [];
  Object.entries(priorityDistribution).forEach(([pri, count]) => {
    for (let i = 0; i < count; i++) priorityPool.push(pri);
  });
  shuffle(priorityPool);

  const startNum = 100001;

  for (let i = 0; i < totalComplaints; i++) {
    const id = getDeterministicUUID(`complaint_${i}`);
    const complaint_number = `UPP-2026-${startNum + i}`;
    
    // Choose district and matching station
    const station = stations[i % stations.length];
    const district = districts.find(d => d.id === station.district_id)!;

    const category = categoryPool[i];
    const status = statusPool[i];
    const priority = priorityPool[i];

    // Build description
    const categoryTemplates = descriptionParts[category];
    const opening = categoryTemplates.openings[i % categoryTemplates.openings.length];
    const middle = categoryTemplates.details[i % categoryTemplates.details.length];
    const closing = categoryTemplates.closings[i % categoryTemplates.closings.length];
    const description = `${opening} ${middle} ${closing}`;

    // Citizen Info
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    const complainant_name = `${fName} ${lName}`;
    const complainant_phone = generateUniquePhone();
    const complainant_email = `${fName.toLowerCase()}.${lName.toLowerCase()}${10 + (i % 90)}@gmail.com`;

    // Severity Score logic
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

    // Created at timestamp
    const startTimestamp = 1767225600000; // 2026-01-01T00:00:00Z
    const endTimestamp = 1782864000000;   // 2026-06-30T00:00:00Z
    const randomTimestamp = startTimestamp + Math.floor(Math.random() * (endTimestamp - startTimestamp));
    const created_at = new Date(randomTimestamp).toISOString();

    // Assign SHO and IO
    const assigned_sho = stationSHOMap.get(station.id)!;
    const ios = stationIOsMap.get(station.id)!;
    
    // Assignment Rules:
    // Cyber Crime -> Cyber trained IO (rank containing 'Cyber')
    // Women Safety -> Women Help Desk (rank containing 'Women')
    // Child Safety -> Child Protection (rank containing 'Child')
    // Others -> General SI (Sub-Inspector rank)
    let assigned_io = ios[3]; // Fallback to first General SI
    
    if (category === 'Cyber Crime') {
      assigned_io = ios.find(io => io.rank.includes('Cyber')) || ios[3];
    } else if (category === 'Women Safety' || category === 'Domestic Violence') {
      assigned_io = ios.find(io => io.rank.includes('Women')) || ios[3];
    } else if (category === 'Child Safety') {
      assigned_io = ios.find(io => io.rank.includes('Child')) || ios[3];
    } else {
      // General SI (General1 or General2)
      const generalSIs = ios.filter(io => io.rank === 'Sub-Inspector');
      assigned_io = generalSIs[i % generalSIs.length] || ios[3];
    }

    // Created by matches the assigned SHO for pending, or a random profile
    const created_by = profiles[i % profiles.length].id;

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
      // Compatibility columns
      district: district.name,
      station: station.name,
      assigned_officer_id: status !== 'Pending' ? assigned_io.id : null,
      // Relational columns
      district_id: district.id,
      station_id: station.id,
      assigned_sho_id: assigned_sho.id,
      assigned_io_id: status !== 'Pending' ? assigned_io.id : null,
      
      created_by,
      created_at,
      updated_at: created_at
    });
  }

  // 5. Generate SQL Content chunk by chunk
  const writeMigrationSeed = () => {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const sqlFilePath = path.join(migrationsDir, '20260619000000_seed_1500.sql');
    const seedFilePath = path.join(process.cwd(), 'supabase', 'seed.sql');

    console.log(`Writing seeds to ${sqlFilePath} and ${seedFilePath}...`);

    let sqlContent = `-- UP Police Seeding script\n`;
    sqlContent += `TRUNCATE public.complaints CASCADE;\n`;
    sqlContent += `TRUNCATE public.profiles CASCADE;\n`;
    sqlContent += `TRUNCATE public.officers CASCADE;\n`;
    sqlContent += `TRUNCATE public.police_stations CASCADE;\n`;
    sqlContent += `TRUNCATE public.districts CASCADE;\n\n`;

    const escape = (str: string | null) => str ? str.replace(/'/g, "''") : '';
    const valOrNull = (v: any) => v === null || v === undefined ? 'NULL' : `'${escape(v)}'`;

    // 1. Write Districts
    sqlContent += `-- Districts\n`;
    const distChunks = chunkArray(districts, 100);
    distChunks.forEach(chunk => {
      sqlContent += `INSERT INTO public.districts (id, district_name, range_name, zone_name) VALUES\n`;
      sqlContent += chunk.map(d => `  ('${d.id}', '${escape(d.name)}', '${escape(d.range)}', '${escape(d.zone)}')`).join(',\n') + ';\n\n';
    });

    // 2. Write Stations
    sqlContent += `-- Police Stations\n`;
    const stationChunks = chunkArray(stations, 100);
    stationChunks.forEach(chunk => {
      sqlContent += `INSERT INTO public.police_stations (id, district_id, station_name, station_code, phone) VALUES\n`;
      sqlContent += chunk.map(s => `  ('${s.id}', '${s.district_id}', '${escape(s.name)}', '${escape(s.code)}', '${escape(s.phone)}')`).join(',\n') + ';\n\n';
    });

    // 3. Write Officers
    sqlContent += `-- Officers\n`;
    const officerChunks = chunkArray(officers, 200);
    officerChunks.forEach((chunk, cIdx) => {
      sqlContent += `INSERT INTO public.officers (id, name, rank, belt_number, mobile, email, district_id, station_id, role, status) VALUES\n`;
      sqlContent += chunk.map(o => {
        const distId = o.district_id ? `'${o.district_id}'` : 'NULL';
        const stationId = o.station_id ? `'${o.station_id}'` : 'NULL';
        return `  ('${o.id}', '${escape(o.name)}', '${escape(o.rank)}', '${escape(o.belt_number)}', '${escape(o.mobile)}', '${escape(o.email)}', ${distId}, ${stationId}, '${o.role}', '${o.status}')`;
      }).join(',\n') + ';\n\n';
      console.log(`Formatted Officer chunk ${cIdx + 1}/${officerChunks.length}`);
    });

    // 4. Write Profiles
    sqlContent += `-- Profiles (linked to Officers)\n`;
    const profileChunks = chunkArray(profiles, 100);
    profileChunks.forEach(chunk => {
      sqlContent += `INSERT INTO public.profiles (id, full_name, badge_number, role, district, station) VALUES\n`;
      sqlContent += chunk.map(p => `  ('${p.id}', '${escape(p.full_name)}', '${escape(p.badge_number)}', '${p.role}', '${escape(p.district)}', '${escape(p.station)}')`).join(',\n') + ';\n\n';
    });

    // 5. Write Complaints
    sqlContent += `-- Complaints\n`;
    const complaintChunks = chunkArray(complaints, 100);
    complaintChunks.forEach((chunk, cIdx) => {
      sqlContent += `INSERT INTO public.complaints (\n`;
      sqlContent += `  id, complaint_number, complainant_name, complainant_phone, complainant_email,\n`;
      sqlContent += `  description, category, ai_predicted_category, ai_severity_score, ai_recommended_action,\n`;
      sqlContent += `  priority, status, district, station, assigned_officer_id,\n`;
      sqlContent += `  district_id, station_id, assigned_sho_id, assigned_io_id, created_by, created_at, updated_at\n`;
      sqlContent += `) VALUES\n`;

      sqlContent += chunk.map(c => {
        const assOfficer = c.assigned_officer_id ? `'${c.assigned_officer_id}'` : 'NULL';
        const distId = c.district_id ? `'${c.district_id}'` : 'NULL';
        const stationId = c.station_id ? `'${c.station_id}'` : 'NULL';
        const assSho = c.assigned_sho_id ? `'${c.assigned_sho_id}'` : 'NULL';
        const assIo = c.assigned_io_id ? `'${c.assigned_io_id}'` : 'NULL';

        return `  (\n` +
          `    '${c.id}',\n` +
          `    '${c.complaint_number}',\n` +
          `    ${valOrNull(c.complainant_name)},\n` +
          `    '${c.complainant_phone}',\n` +
          `    ${valOrNull(c.complainant_email)},\n` +
          `    ${valOrNull(c.description)},\n` +
          `    '${c.category}',\n` +
          `    '${c.ai_predicted_category}',\n` +
          `    ${c.ai_severity_score},\n` +
          `    ${valOrNull(c.ai_recommended_action)},\n` +
          `    '${c.priority}',\n` +
          `    '${c.status}',\n` +
          `    '${escape(c.district)}',\n` +
          `    '${escape(c.station)}',\n` +
          `    ${assOfficer},\n` +
          `    ${distId},\n` +
          `    ${stationId},\n` +
          `    ${assSho},\n` +
          `    ${assIo},\n` +
          `    '${c.created_by}',\n` +
          `    '${c.created_at}',\n` +
          `    '${c.updated_at}'\n` +
          `  )`;
      }).join(',\n') + ';\n\n';
      console.log(`Formatted Complaint chunk ${cIdx + 1}/${complaintChunks.length}`);
    });

    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    fs.writeFileSync(seedFilePath, sqlContent, 'utf8');
    console.log("SQL seed files successfully written.");
  };

  writeMigrationSeed();

  // 6. Supabase direct upload if credentials exist
  uploadToSupabaseDirect();

  function uploadToSupabaseDirect() {
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url' || !supabaseAnonKey.startsWith('ey')) {
      console.log("Supabase URL/Key missing. Skipping database upload, SQL file is written.");
      return;
    }

    console.log("Connecting to live Supabase...");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Skip direct upload via client if it is too massive (Supabase restricts bulk inserts via client key on certain tables, and we have 8000+ items).
    // The seed.sql and migration seed files are sufficient and the recommended way to load bulk seed data.
    console.log("SQL seeds written to file. Seeding via migration files/seed.sql is recommended for large datasets (8,500+ records).");
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

main();
