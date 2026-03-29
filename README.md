# WSS Growth Machine

Autonomous lead generation and outreach engine for **We Scale Startups (WSS)**.

> **Repository visibility:** This repo should be **private**. If you can see it on
> GitHub without authentication, change the visibility in Settings > General > Danger Zone.

## Architecture

```
WF1 Signal Collector (12 RSS feeds, every 4h)
  > WF2 Rule Filter + Enrichment (Apollo People Search)
    > WF3 Deep Research (AI scoring)
      > WF4 Daily Digest (Slack notifications)
        > WF5 Outreach Sender (Gmail drafts)
          > WF6 Reply Detection (every 4h)
            > WF9 Follow-up Sequencer (daily)

WF7 Weekly Self-Optimization (metrics + recommendations)
WF8 Newsletter Bridge (MailerLite > lead pipeline)
```

## Stack

- **Orchestration**: n8n Cloud (9 workflows)
- **Database**: Supabase (PostgreSQL + RLS)
- **Email**: Gmail (draft-first approach)
- **Enrichment**: Apollo.io (people search + email match)
- **Notifications**: Slack
- **Newsletter**: MailerLite
- **Dashboard**: Static HTML on Netlify, with Netlify Functions as API proxy

## Quick start

### 1. Clone & configure

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, N8N_WEBHOOK_URL, APPROVAL_SECRET
```

### 2. Create the database

Run `supabase/schema.sql` against your Supabase project (SQL Editor in the dashboard).
This creates all 10 tables and enables Row Level Security on each.

### 3. Verify RLS

In Supabase > Authentication > Policies, confirm that every table has RLS enabled
and **no** public/anon SELECT policies exist. The dashboard reads data through a
Netlify Function using the **service-role key**, which bypasses RLS server-side.

### 4. Deploy to Netlify

```bash
# Install Netlify CLI if needed
npm i -g netlify-cli

# Link to your site and set env vars
netlify link
netlify env:set SUPABASE_URL "https://YOUR_PROJECT.supabase.co"
netlify env:set SUPABASE_SERVICE_KEY "eyJ..."
netlify env:set N8N_WEBHOOK_URL "https://YOUR_INSTANCE.app.n8n.cloud/webhook/approval-action"
netlify env:set APPROVAL_SECRET "$(openssl rand -hex 32)"
netlify env:set ALLOWED_ORIGIN "https://your-site.netlify.app"

netlify deploy --prod
```

### 5. Secure the n8n webhook

In your n8n approval-action workflow, add a header-auth check node that verifies
`X-Approval-Secret` matches your `APPROVAL_SECRET`. Reject requests that don't
include it.

## File structure

```
.
├── wss-growth-machine.html      # Canonical dashboard (serves at /)
├── dashboard/index.html          # Redirect to canonical dashboard
├── netlify/functions/api.js      # Server-side API proxy (Supabase + webhook)
├── netlify.toml                  # Build & redirect config
├── supabase/schema.sql           # Full database schema with RLS
├── docs/WSS-Machine-Status.md    # Operational status log
├── .env.example                  # Environment variable template
└── .gitignore
```

## Security model

- **No credentials in client-side code.** The browser calls `/api` which is a
  Netlify Function. Supabase keys and n8n webhook URLs live only in server-side
  environment variables.
- **RLS enabled on all tables.** The anon key cannot read any data. Only the
  service-role key (used by the Netlify Function) can query.
- **Approval actions are authenticated.** The `/api` POST proxy adds an
  `X-Approval-Secret` header that n8n must validate before executing.
- **No innerHTML.** All dynamic content is rendered via `textContent` and
  `createElement` to prevent stored XSS from RSS/Apollo/AI-generated data.

## License

Private — We Scale Startups
