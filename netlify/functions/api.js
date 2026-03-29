// Netlify serverless function — proxies Supabase reads and approval actions
// so the browser never sees the Supabase key or n8n webhook URL.

const ALLOWED_ENDPOINTS = [
  'prospects?select=id,company_name,rule_filter_passed,ingested_at&order=ingested_at.desc',
  'enriched_leads?select=id,confidence_score,routing',
  'enriched_leads?select=id,prospect_id,confidence_score,routing,company_summary,angle_description,enriched_at,prospects!enriched_leads_prospect_id_fkey(company_name)&order=confidence_score.desc&limit=20',
  'outreach_log?select=id,status,reply_sentiment,created_at',
  'approval_queue?select=*&order=created_at.desc&limit=20',
];

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Server misconfigured — missing Supabase env vars' }),
    };
  }

  // ── GET /api?endpoint=<table query> — read-only Supabase proxy ──
  if (event.httpMethod === 'GET') {
    const endpoint = event.queryStringParameters?.endpoint;
    if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ error: 'Invalid or disallowed endpoint' }),
      };
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      return {
        statusCode: res.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (err) {
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({ error: 'Upstream request failed' }),
      };
    }
  }

  // ── POST /api — approval action proxy ──
  if (event.httpMethod === 'POST') {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const APPROVAL_SECRET = process.env.APPROVAL_SECRET;

    if (!N8N_WEBHOOK_URL || !APPROVAL_SECRET) {
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: 'Server misconfigured — missing webhook env vars' }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    const { approval_id, action } = body;
    if (!approval_id || !['approve', 'reject'].includes(action)) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ error: 'approval_id and action (approve|reject) required' }),
      };
    }

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Approval-Secret': APPROVAL_SECRET,
        },
        body: JSON.stringify({ approval_id, action }),
      });
      const data = await res.json();
      return {
        statusCode: res.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (err) {
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({ error: 'Webhook request failed' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: cors,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
