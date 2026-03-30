// Vercel serverless function — proxies Supabase reads and approval actions
// so the browser never sees the Supabase key or n8n webhook URL.

const ALLOWED_ENDPOINTS = [
  'prospects?select=id,company_name,rule_filter_passed,ingested_at&order=ingested_at.desc',
  'enriched_leads?select=id,confidence_score,routing',
  'enriched_leads?select=id,prospect_id,confidence_score,routing,company_summary,angle_description,enriched_at,prospects!enriched_leads_prospect_id_fkey(company_name)&order=confidence_score.desc&limit=20',
  'outreach_log?select=id,status,reply_sentiment,created_at',
  'approval_queue?select=*&order=created_at.desc&limit=20',
];

function cors(res) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured — missing Supabase env vars' });
  }

  // ── GET /api?endpoint=<table query> — read-only Supabase proxy ──
  if (req.method === 'GET') {
    const endpoint = req.query.endpoint;
    if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
      return res.status(400).json({ error: 'Invalid or disallowed endpoint' });
    }

    try {
      const upstream = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    } catch {
      return res.status(502).json({ error: 'Upstream request failed' });
    }
  }

  // ── POST /api — approval action proxy ──
  if (req.method === 'POST') {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const APPROVAL_SECRET = process.env.APPROVAL_SECRET;

    if (!N8N_WEBHOOK_URL || !APPROVAL_SECRET) {
      return res.status(500).json({ error: 'Server misconfigured — missing webhook env vars' });
    }

    const { approval_id, action } = req.body || {};
    if (!approval_id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'approval_id and action (approve|reject) required' });
    }

    try {
      const upstream = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Approval-Secret': APPROVAL_SECRET,
        },
        body: JSON.stringify({ approval_id, action }),
      });

      // Tolerate non-JSON responses (204 No Content, plain text, empty body)
      const text = await upstream.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      // Treat any 2xx as success if n8n didn't include an explicit success field
      if (upstream.ok && data.success === undefined) {
        data.success = true;
      }

      return res.status(upstream.ok ? 200 : upstream.status).json(data);
    } catch {
      return res.status(502).json({ error: 'Webhook request failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
