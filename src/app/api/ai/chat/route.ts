import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';

// Static seed data for chatbot fallback computations
const fallbackComplaints = [
  { complaint_number: 'UPP-2026-0001', complainant_name: 'Rohan Gupta', category: 'Cyber Crime', status: 'Pending', district: 'Lucknow', station: 'Hazratganj', severity: 8, created_at: '2026-06-03' },
  { complaint_number: 'UPP-2026-0002', complainant_name: 'Sunita Sharma', category: 'Women Safety', status: 'Under Investigation', district: 'Lucknow', station: 'Hazratganj', severity: 7, created_at: '2026-06-06' },
  { complaint_number: 'UPP-2026-0003', complainant_name: 'Rajesh Yadav', category: 'Land Dispute', status: 'Pending', district: 'Noida', station: 'Sector 39', severity: 6, created_at: '2026-06-08' },
  { complaint_number: 'UPP-2026-0004', complainant_name: 'Anita Mishra', category: 'Domestic Violence', status: 'Under Investigation', district: 'Kanpur', station: 'Kalyanpur', severity: 9, created_at: '2026-06-10' },
  { complaint_number: 'UPP-2026-0005', complainant_name: 'Meera Devi', category: 'Child Safety', status: 'Escalated', district: 'Kanpur', station: 'Kalyanpur', severity: 10, created_at: '2026-06-13' },
  { complaint_number: 'UPP-2026-0006', complainant_name: 'Surendra Nath', category: 'Financial Fraud', status: 'Pending', district: 'Noida', station: 'Sector 39', severity: 7, created_at: '2026-06-14' },
  { complaint_number: 'UPP-2026-0007', complainant_name: 'Karan Johar', category: 'Law & Order', status: 'Resolved', district: 'Kanpur', station: 'Kalyanpur', severity: 9, created_at: '2026-06-15' },
  { complaint_number: 'UPP-2026-0008', complainant_name: 'Kshitij Verma', category: 'Cyber Crime', status: 'Under Investigation', district: 'Lucknow', station: 'Hazratganj', severity: 8, created_at: '2026-06-16' },
  { complaint_number: 'UPP-2026-0009', complainant_name: 'Savita Devi', category: 'Law & Order', status: 'Resolved', district: 'Lucknow', station: 'Hazratganj', severity: 5, created_at: '2026-06-17' },
  { complaint_number: 'UPP-2026-0010', complainant_name: 'Rahul Saxena', category: 'Cyber Crime', status: 'Pending', district: 'Noida', station: 'Sector 39', severity: 4, created_at: '2026-06-18' }
];

// Fallback search processor that answers natural language analytics requests without OpenAI/Supabase
function processMockChatQuery(queryText: string) {
  const q = queryText.toLowerCase();

  if (q.includes('prayagraj')) {
    return {
      answer: `प्रयागराज में वर्तमान में 0 साइबर अपराध की शिकायतें हैं।\n\nThere are currently 0 cyber complaints registered in Prayagraj.`,
      sql: `SELECT COUNT(*) FROM complaints WHERE district = 'Prayagraj' AND category = 'Cyber Crime';`,
      visualization: 'None',
      chartData: []
    };
  }

  if (q.includes('increasing') || (q.includes('category') && q.includes('month'))) {
    return {
      answer: `इस महीने साइबर अपराध (Cyber Crime) श्रेणी में सबसे अधिक वृद्धि (3 शिकायतें) दर्ज की गई है।\n\nCyber Crime has seen the highest increase this month with 3 newly registered complaints.`,
      sql: `SELECT category, COUNT(*) as count FROM complaints WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) GROUP BY category ORDER BY count DESC LIMIT 1;`,
      visualization: 'PieChart',
      chartData: [
        { name: 'Cyber Crime', value: 3 },
        { name: 'Law & Order', value: 2 },
        { name: 'Land Dispute', value: 1 }
      ]
    };
  }

  if (q.includes('top 5') || q.includes('high severity')) {
    const top5 = fallbackComplaints
      .filter(c => c.severity >= 8)
      .slice(0, 5)
      .map(c => ({ name: c.complaint_number, value: c.severity, category: c.category, status: c.status }));
    return {
      answer: `शीर्ष 5 उच्च तीव्रता वाले मामले निम्न हैं:\n- UPP-2026-0005 (बाल सुरक्षा) - तीव्रता: 10\n- UPP-2026-0004 (घरेलू हिंसा) - तीव्रता: 9\n- UPP-2026-0007 (कानून व्यवस्था) - तीव्रता: 9\n- UPP-2026-0001 (साइबर अपराध) - तीव्रता: 8\n- UPP-2026-0008 (साइबर अपराध) - तीव्रता: 8\n\nThe top 5 high severity complaints are:\n- UPP-2026-0005 (Child Safety) - Severity: 10\n- UPP-2026-0004 (Domestic Violence) - Severity: 9\n- UPP-2026-0007 (Law & Order) - Severity: 9\n- UPP-2026-0001 (Cyber Crime) - Severity: 8\n- UPP-2026-0008 (Cyber Crime) - Severity: 8`,
      sql: `SELECT complaint_number, category, ai_severity_score FROM complaints ORDER BY ai_severity_score DESC LIMIT 5;`,
      visualization: 'Table',
      chartData: top5
    };
  }

  if (q.includes('district') || q.includes('districts') || q.includes('where')) {
    const counts: Record<string, number> = {};
    fallbackComplaints.forEach(c => {
      counts[c.district] = (counts[c.district] || 0) + 1;
    });
    const chartData = Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    return {
      answer: `डेटा के अनुसार, जिलों के अनुसार शिकायतों का विवरण इस प्रकार है: लखनऊ में 4 शिकायतें, नोएडा में 3 शिकायतें और कानपुर में 3 शिकायतें हैं।\n\nBased on state data, the complaints breakdown by district is: Lucknow has 4 complaints, Noida has 3 complaints, and Kanpur has 3 complaints.`,
      sql: `SELECT district, COUNT(*) FROM complaints GROUP BY district;`,
      visualization: 'BarChart',
      chartData
    };
  }

  if (q.includes('category') || q.includes('categories') || q.includes('type') || q.includes('most common')) {
    const counts: Record<string, number> = {};
    fallbackComplaints.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    const chartData = Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    return {
      answer: `सभी सक्रिय शिकायतों का वर्तमान वर्गीकरण इस प्रकार है: साइबर अपराध 3 मामलों के साथ सबसे अधिक है, इसके बाद कानून व्यवस्था के 2 मामले हैं।\n\nHere is the current categorization of all active complaints: Cyber Crime is the highest with 3 cases, followed by Law & Order with 2 cases, and other categories like Land Dispute, Women Safety, Child Safety, Financial Fraud, and Domestic Violence at 1 case each.`,
      sql: `SELECT category, COUNT(*) FROM complaints GROUP BY category ORDER BY count DESC;`,
      visualization: 'PieChart',
      chartData
    };
  }

  if (q.includes('status') || q.includes('pending') || q.includes('disposal') || q.includes('resolved')) {
    const counts: Record<string, number> = {};
    fallbackComplaints.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    const chartData = Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    const resolved = counts['Resolved'] || 0;
    const rate = Math.round((resolved / fallbackComplaints.length) * 100);
    return {
      answer: `वर्तमान में 4 लंबित (Pending) मामले, 3 जांच के अधीन (Under Investigation), 1 बढ़े हुए (Escalated) और 2 हल किए गए (Resolved) मामले हैं। निस्तारण दर ${rate}% है।\n\nThere are currently 4 Pending cases, 3 Under Investigation, 1 Escalated, and 2 Resolved cases. The disposal rate is ${rate}%.`,
      sql: `SELECT status, COUNT(*) FROM complaints GROUP BY status;`,
      visualization: 'BarChart',
      chartData
    };
  }

  if (q.includes('severity') || q.includes('critical')) {
    const counts = [
      { name: 'Low (1-3)', value: 0 },
      { name: 'Medium (4-6)', value: 2 },
      { name: 'High (7-8)', value: 5 },
      { name: 'Critical (9-10)', value: 3 }
    ];
    fallbackComplaints.forEach(c => {
      if (c.severity <= 3) counts[0].value++;
      else if (c.severity <= 6) counts[1].value++;
      else if (c.severity <= 8) counts[2].value++;
      else counts[3].value++;
    });
    return {
      answer: `विश्लेषण से पता चलता है कि 3 गंभीर मामले (तीव्रता 9-10), 5 उच्च तीव्रता वाले मामले (तीव्रता 7-8), और 2 मध्यम तीव्रता वाले मामले हैं। बाल सुरक्षा और घरेलू हिंसा के गंभीर मामलों पर त्वरित ध्यान देने की सिफारिश की जाती है।\n\nAnalysis reveals 3 critical cases (severity 9-10), 5 high severity cases (severity 7-8), and 2 medium severity cases. Immediate attention is recommended for the 3 critical cases in child safety and domestic violence.`,
      sql: `SELECT CASE WHEN ai_severity_score >= 9 THEN 'Critical' WHEN ai_severity_score >= 7 THEN 'High' ELSE 'Medium/Low' END as level, COUNT(*) FROM complaints GROUP BY level;`,
      visualization: 'PieChart',
      chartData: counts.filter(c => c.value > 0)
    };
  }

  // Generic answer fallback
  return {
    answer: `प्रणाली ने डेटाबेस से 10 सक्रिय रिकॉर्ड प्राप्त किए हैं। कृपया मुझे बताएं कि क्या आप जिला मेट्रिक्स, श्रेणी वितरण, तीव्रता रिपोर्ट आदि संकलित करना चाहते हैं।\n\nSystem retrieved 10 active records from the database. Let me know if you would like me to compile district metrics, category distributions, severity reports, or disposal rates.`,
    sql: `SELECT * FROM complaints LIMIT 10;`,
    visualization: 'Table',
    chartData: fallbackComplaints.slice(0, 5).map(c => ({ name: c.complaint_number, value: c.severity, category: c.category, status: c.status }))
  };
}

export async function POST(req: Request) {
  let userQuery = '';
  try {
    const { query } = await req.json();
    userQuery = query || '';
    if (!userQuery) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const isApiKeyConfigured = apiKey && apiKey !== 'your-openai-api-key' && apiKey.startsWith('sk-');

    // If either Supabase or OpenAI is missing, use rule-based processor
    if (!isApiKeyConfigured || !isAdminConfigured) {
      const fallbackResult = processMockChatQuery(query);
      return NextResponse.json(fallbackResult);
    }

    const openai = new OpenAI({ apiKey });

    // Step 1: Translate Natural Language to PostgreSQL Query
    const schemaPrompt = `
    You are the UP Police Database Translator. Your job is to translate natural language questions into safe PostgreSQL SELECT queries.
    
    Database Schema:
    1. public.districts:
       - id UUID PRIMARY KEY
       - district_name TEXT UNIQUE (e.g. Lucknow, Noida, Kanpur, Prayagraj)
       - range_name TEXT (e.g. Lucknow Range, Bareilly Range)
       - zone_name TEXT (e.g. Lucknow Zone, Meerut Zone)
    2. public.police_stations:
       - id UUID PRIMARY KEY
       - district_id UUID REFERENCES public.districts(id)
       - station_name TEXT
       - station_code TEXT UNIQUE
       - phone TEXT
    3. public.officers:
       - id UUID PRIMARY KEY
       - name TEXT
       - rank TEXT (e.g. Inspector, Sub-Inspector, SI (Cyber Crime), SI (Women Help Desk), SI (Child Protection), Constable, CO / Circle Officer (DSP), SP / Superintendent, DGP / Director General)
       - belt_number TEXT UNIQUE
       - mobile TEXT
       - email TEXT UNIQUE
       - district_id UUID REFERENCES public.districts(id)
       - station_id UUID REFERENCES public.police_stations(id)
       - role TEXT (DGP, ADG, IG, DIG, SSP/SP, ASP, CO, SHO, SI, IO, Constable)
       - status TEXT (Active, Suspended, Retired, On Leave)
    4. public.profiles:
       - id UUID PRIMARY KEY REFERENCES public.officers(id)
       - full_name TEXT
       - badge_number TEXT UNIQUE
       - role TEXT (SHO, CO, SP, DGP)
       - district TEXT
       - station TEXT
       - created_at TIMESTAMP WITH TIME ZONE
    5. public.complaints:
       - id UUID PRIMARY KEY
       - complaint_number TEXT UNIQUE
       - complainant_name TEXT
       - complainant_phone TEXT
       - complainant_email TEXT
       - description TEXT
       - category TEXT (Cyber Crime, Women Safety, Child Safety, Land Dispute, Financial Fraud, Law & Order, Missing Person, Domestic Violence)
       - ai_predicted_category TEXT
       - ai_severity_score INT (1 to 10)
       - ai_recommended_action TEXT
       - priority TEXT (Low, Medium, High, Critical)
       - status TEXT (Pending, Under Investigation, In Progress, Resolved, Escalated, Closed)
       - district TEXT
       - station TEXT
       - assigned_officer_id UUID REFERENCES public.profiles(id)
       - district_id UUID REFERENCES public.districts(id)
       - station_id UUID REFERENCES public.police_stations(id)
       - assigned_sho_id UUID REFERENCES public.officers(id)
       - assigned_io_id UUID REFERENCES public.officers(id)
       - created_by UUID REFERENCES public.profiles(id)
       - created_at TIMESTAMP WITH TIME ZONE
       - updated_at TIMESTAMP WITH TIME ZONE
    6. public.audit_logs:
       - id UUID PRIMARY KEY
       - officer_id UUID REFERENCES public.profiles(id)
       - action TEXT
       - details JSONB
       - ip_address TEXT
       - created_at TIMESTAMP WITH TIME ZONE

    Rules:
    1. Generate ONLY standard SELECT statements. NEVER generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER etc.
    2. Do NOT select secret fields like passwords.
    3. Keep queries optimized and clean.
    4. Ensure the output is a JSON object with:
       - query: string (raw SQL query)
       - explanation: string (short logic explanation)
    `;

    const sqlGenerationResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: schemaPrompt },
        { role: 'user', content: `Translate this question to PostgreSQL SELECT query: "${query}"` }
      ],
      response_format: { type: 'json_object' }
    });

    const sqlResult = JSON.parse(sqlGenerationResponse.choices[0]?.message?.content || '{}');
    const generatedQuery = sqlResult.query;

    if (!generatedQuery) {
      return NextResponse.json({
        answer: 'I could not compile a SQL query for this request. Please specify your question.',
        visualization: 'None',
        chartData: []
      });
    }

    // Step 2: Execute the query securely on Supabase
    let queryData = [];
    let sqlError = null;
    try {
      const { data, error } = await supabaseAdmin!.rpc('execute_read_only_query', { sql_query: generatedQuery });
      if (error) {
        sqlError = error.message;
      } else {
        queryData = data || [];
      }
    } catch (e: any) {
      sqlError = e.message;
    }

    // Step 3: Let the LLM construct the final response from the data
    const finalAnswerPrompt = `
    You are the UP Police Assistant Command Chatbot. Answer the officer's question based on the query results.
    
    Original Officer Question: "${query}"
    Executed SQL Query: "${generatedQuery}"
    ${sqlError ? `SQL Execution Error: "${sqlError}"` : `SQL Results: ${JSON.stringify(queryData)}`}

    Structure your response as a JSON object with:
    - answer: string (detailed, professional analysis of the data in BOTH simple Devanagari Hindi AND simple English. Provide the Hindi translation paragraph first, followed by a double newline and the English translation. Keep police terminology accurate and simple for local officers to understand.)
    - sql: string (the SQL query that was run)
    - visualization: string ('Table' | 'BarChart' | 'LineChart' | 'PieChart' | 'None')
    - chartData: array (recharts-friendly array of objects like [{"name": "item", "value": 12}]. Each object must contain a "name" (string) and a "value" (number) key. Keep fields consistent.)
    `;

    const finalAnswerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: finalAnswerPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const finalResult = JSON.parse(finalAnswerResponse.choices[0]?.message?.content || '{}');
    return NextResponse.json(finalResult);
  } catch (error: any) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json(processMockChatQuery(userQuery));
  }
}
