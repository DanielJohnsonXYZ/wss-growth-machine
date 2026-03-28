# WSS Growth Machine

Autonomous lead generation and outreach engine for **We Scale Startups (WSS)**.

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
- **Database**: Supabase (PostgreSQL)
- **Email**: Gmail (draft-first approach)
- **Enrichment**: Apollo.io (people search + email match)
- **Notifications**: Slack
- **Newsletter**: MailerLite
- **Dashboard**: Static HTML (Netlify)

## Live Dashboard

[wss-lead-engine-dashboard.netlify.app](https://wss-lead-engine-dashboard.netlify.app)

## License

Private - We Scale Startups
