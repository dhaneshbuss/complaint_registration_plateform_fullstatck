import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Rule-based classification engine to use if OpenAI credentials are not configured
function mockClassify(text: string) {
  const lowercase = text.toLowerCase();
  let category = 'Law & Order';
  let severity = 5;
  let action = 'Dispatch patrol unit to verify facts on the ground and submit status report.';

  if (lowercase.includes('cyber') || lowercase.includes('hack') || lowercase.includes('online') || lowercase.includes('whatsapp') || lowercase.includes('facebook') || lowercase.includes('instagram')) {
    category = 'Cyber Crime';
    severity = 7;
    action = 'Request IP traces of caller/account, initiate digital forensics review, and coordinate with the cyber cell.';
  } else if (lowercase.includes('woman') || lowercase.includes('women') || lowercase.includes('stalk') || lowercase.includes('girl') || lowercase.includes('eve-teas') || lowercase.includes('tease')) {
    category = 'Women Safety';
    severity = 8;
    action = 'Assign to Local Women Power Line (1090) team, verify CCTV footage near site of incident, and increase street patrols.';
  } else if (lowercase.includes('child') || lowercase.includes('kid') || lowercase.includes('son') || lowercase.includes('daughter') || lowercase.includes('minor') || lowercase.includes('9-year') || lowercase.includes('school')) {
    category = 'Child Safety';
    severity = 9;
    action = 'Coordinate with child protection units, review camera footage from nearby transit hubs, and issue alerts to local stations.';
  } else if (lowercase.includes('land') || lowercase.includes('plot') || lowercase.includes('property') || lowercase.includes('construction') || lowercase.includes('mafia')) {
    category = 'Land Dispute';
    severity = 6;
    action = 'Check local revenue department/registry papers, direct station staff to issue warning to avoid breaches of peace.';
  } else if (lowercase.includes('fraud') || lowercase.includes('bank') || lowercase.includes('otp') || lowercase.includes('money') || lowercase.includes('lakh') || lowercase.includes('inr') || lowercase.includes('card') || lowercase.includes('upi')) {
    category = 'Financial Fraud';
    severity = 8;
    action = 'Send immediate freeze requests to the receiving banks, pull UPI transaction logs, and initiate block on suspicious account numbers.';
  } else if (lowercase.includes('missing') || lowercase.includes('lost') || lowercase.includes('disappear') || lowercase.includes('whereabouts')) {
    category = 'Missing Person';
    severity = 8;
    action = 'Circulate photo/description to all border points, bus terminals, and railway stations, and register missing report.';
  } else if (lowercase.includes('wife') || lowercase.includes('husband') || lowercase.includes('beat') || lowercase.includes('domestic') || lowercase.includes('marriage') || lowercase.includes('abuse')) {
    category = 'Domestic Violence';
    severity = 7;
    action = 'Dispatch domestic cell officers, offer immediate medical verification/counseling support, and record statement of the victim.';
  }

  // Derive priority based on severity
  let priority = 'Medium';
  if (severity >= 9) priority = 'Critical';
  else if (severity >= 7) priority = 'High';
  else if (severity <= 4) priority = 'Low';

  return {
    category,
    severity,
    priority,
    suggested_action: action,
    // Backward compatibility
    ai_predicted_category: category,
    ai_severity_score: severity,
    ai_recommended_action: action,
    confidence_score: 0.95
  };
}

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: 'Description parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const isApiKeyConfigured = apiKey && apiKey !== 'your-openai-api-key' && apiKey.startsWith('sk-');

    if (!isApiKeyConfigured) {
      // Safe fallback
      const mockResult = mockClassify(description);
      return NextResponse.json(mockResult);
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are the UP Police AI Engine. Analyze police complaints and categorize them into one of the following exact categories: Cyber Crime, Women Safety, Child Safety, Land Dispute, Financial Fraud, Law & Order, Missing Person, Domestic Violence. Return a JSON object with:
          - category: string (must be one of the 8 categories listed above)
          - severity: integer (1 to 10 based on threat, loss, violence, vulnerability)
          - priority: string (must be one of: Low, Medium, High, Critical)
          - suggested_action: string (clear, actionable first step for investigating officers)
          Ensure you return only valid JSON.`
        },
        {
          role: 'user',
          content: `Complaint description: ${description}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(resultText);

    // Map keys correctly and fill default values
    const category = parsed.category || parsed.ai_predicted_category || 'Law & Order';
    const severity = Number(parsed.severity || parsed.ai_severity_score || 5);
    const priority = parsed.priority || 'Medium';
    const suggested_action = parsed.suggested_action || parsed.ai_recommended_action || 'Dispatch patrol unit to verify details.';

    const result = {
      category,
      severity,
      priority,
      suggested_action,
      // Backward compatibility
      ai_predicted_category: category,
      ai_severity_score: severity,
      ai_recommended_action: suggested_action,
      confidence_score: parsed.confidence_score || 0.95
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Classification API Error:', error);
    // Gracefully fallback on error
    try {
      const body = await req.clone().json();
      return NextResponse.json(mockClassify(body.description || ''));
    } catch {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
