-- WSS Growth Machine — Supabase schema
-- Run this against a fresh Supabase project to recreate all tables.
-- After creating the tables, enable RLS on every table (see bottom).

-- 1. Raw signals from RSS feeds
CREATE TABLE IF NOT EXISTS prospects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name  TEXT NOT NULL,
    source        TEXT,
    signal_type   TEXT,
    url           TEXT,
    rule_filter_passed BOOLEAN DEFAULT FALSE,
    ingested_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. AI research + outreach copy
CREATE TABLE IF NOT EXISTS enriched_leads (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id      UUID REFERENCES prospects(id),
    confidence_score NUMERIC,
    routing          TEXT,           -- hot_lead | warm_lead | skip
    company_summary  TEXT,
    angle_description TEXT,
    email_subject    TEXT,
    email_body       TEXT,
    linkedin_message TEXT,
    enriched_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Sent messages tracking
CREATE TABLE IF NOT EXISTS outreach_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enriched_lead_id UUID REFERENCES enriched_leads(id),
    status          TEXT DEFAULT 'draft_created',  -- draft_created | sent | replied
    gmail_draft_id  TEXT,
    gmail_thread_id TEXT,
    reply_sentiment TEXT,           -- positive | neutral | negative
    sequence_step   INT DEFAULT 0,
    last_notified_step INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    sent_at         TIMESTAMPTZ,
    replied_at      TIMESTAMPTZ
);

-- 4. Approval queue for human-in-the-loop outreach
CREATE TABLE IF NOT EXISTS approval_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enriched_lead_id UUID REFERENCES enriched_leads(id),
    company_name    TEXT,
    contact_name    TEXT,
    contact_email   TEXT,
    email_subject   TEXT,
    email_body      TEXT,
    confidence_score NUMERIC,
    status          TEXT DEFAULT 'pending',  -- pending | approved | rejected
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. Reply / meeting / deal tracking
CREATE TABLE IF NOT EXISTS lead_outcomes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outreach_log_id UUID REFERENCES outreach_log(id),
    outcome_type    TEXT,           -- reply | meeting_booked | deal_won | deal_lost
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. A/B test tracking
CREATE TABLE IF NOT EXISTS outreach_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_name    TEXT,
    subject_line    TEXT,
    body_template   TEXT,
    sends           INT DEFAULT 0,
    opens           INT DEFAULT 0,
    replies         INT DEFAULT 0,
    positive_replies INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. Weekly metrics
CREATE TABLE IF NOT EXISTS system_performance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start      DATE,
    prospects_found INT DEFAULT 0,
    leads_enriched  INT DEFAULT 0,
    emails_sent     INT DEFAULT 0,
    replies_received INT DEFAULT 0,
    meetings_booked INT DEFAULT 0,
    recommendations JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 8. Self-optimizing prompts
CREATE TABLE IF NOT EXISTS prompt_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name     TEXT,
    prompt_text     TEXT,
    version         INT DEFAULT 1,
    performance_score NUMERIC,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 9. RSS source quality
CREATE TABLE IF NOT EXISTS source_performance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name     TEXT,
    feed_url        TEXT,
    total_signals   INT DEFAULT 0,
    passed_filter   INT DEFAULT 0,
    hot_leads       INT DEFAULT 0,
    last_checked    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 10. MailerLite cross-pollination
CREATE TABLE IF NOT EXISTS newsletter_engagement (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_email TEXT,
    engagement_score NUMERIC,
    prospect_match  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now()
);


-- ════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — enable on every table
-- ════════════════════════════════════════════════════
-- By default no public/anon access is granted.
-- The dashboard reads through a Netlify Function using the
-- service-role key, which bypasses RLS.
-- If you later need browser-direct access, add explicit
-- policies per table rather than leaving them open.

ALTER TABLE prospects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE enriched_leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_outcomes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_variants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_performance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_engagement ENABLE ROW LEVEL SECURITY;
