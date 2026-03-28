# WSS Machine — Setup Status
**Updated:** 27 March 2026, 3:30pm

---

## COMPLETED (via API — no manual work needed)

### Task 1: Calendly → CRM workflow in n8n ✅
- Workflow ID: `UjowNTkbcNwcEg8B`
- All 3 Notion API credentials wired automatically
- Slack OAuth2 credential connected to #ai-updates node
- Workflow **active** and MCP-enabled

### Task 2: MailerLite → CRM workflow in n8n ✅
- Workflow ID: `T5tVJzhtMOGJKtSu`
- All 3 Notion API credentials wired automatically
- Workflow **active** and MCP-enabled

### Task 6: MailerLite webhook ✅
- Webhook ID: `182905317770659608`
- Event: `subscriber.created`
- Status: **enabled**

### Task 7: Nurture email content + design ✅ (ACTIVE)
- Automation: "WSS Lead Magnet Nurture — 10 emails, 60 days"
- **Status: ACTIVE**
- All 10 emails loaded with rich-text HTML content
- All 19 steps (10 emails + 9 delays) confirmed valid
---

## LEAD ENGINE v3 — Automated Outbound Pipeline ✅

4 n8n workflows created, audited, patched, and re-activated on 27 March 2026.

### Workflow 1: Signal Collector (`CudWd1eN61QPoCcY`) ✅ ACTIVE
- Schedule: Every 4 hours
- Sources: 12 RSS feeds (Crunchbase, TechCrunch, Product Hunt, HackerNews, Google News, VentureBeat AI, EU Startups, SiliconAngle, + more)
- Processing: Keyword matching, signal detection, deduplication
- Output: `prospects` table via Supabase REST API

### Workflow 2: Rule Filter + Enrichment (`SDwXFTFY6Mjv3pwx`) ✅ ACTIVE
- ICP Filter: Scores on vertical, stage, signal priority, funding
- Enrichment: Apollo Company Search + People Search + Email Match
- Output: Updates prospects with decision-maker contacts

### Workflow 3: AI Research Chain (`CqlaDtpcUDNEi0ne`) ✅ ACTIVE
- Claude Research: Company overview, WSS fit score, routing
- Claude Outreach: Email + LinkedIn copy generation
- Output: `enriched_leads` table

### Workflow 4: Daily Digest (`bCXW5wNvIHUrLF03`) ✅ ACTIVE
- Schedule: Daily at 8am
- Hot leads + warm leads digest to Slack #ai-updates

### Workflow 5: Outreach Sender (`Vsmdl5bmLcG3aL0B`) — READY
- Schedule: Every 12 hours
- Creates Gmail drafts for hot leads (draft-first, review before send)

### Workflow 6: Reply Detection (`XH2FE22XCYff8cZW`) — READY
- Schedule: Every 4 hours
- Searches Gmail for replies to outreach emails

### Workflow 7: Weekly Self-Optimization (`dPeVfRm6UFnFnQ8U`) — READY
- Schedule: Weekly Monday 9am
- Auto-generates performance recommendations

### Workflow 8: Newsletter Bridge (`BZN19Ezs1BkXClrm`) — READY
- MailerLite subscriber engagement → lead pipeline cross-pollination

### Workflow 9: Follow-up Sequencer (`xQUncaVL1niGwIrk`) — READY
- Day 0→3→7→10→14 multi-touch follow-up orchestration

### Supabase Schema (9 tables)
- `prospects` — raw signals from RSS feeds
- `enriched_leads` — AI research + outreach copy
- `outreach_log` — sent messages tracking
- `lead_outcomes` — reply/meeting/deal tracking
- `outreach_variants` — A/B test tracking
- `system_performance` — weekly metrics
- `prompt_versions` — self-optimizing prompts
- `source_performance` — RSS source quality
- `newsletter_engagement` — MailerLite cross-pollination