# DigitalAimz AI Business OS — Changelog

All notable changes tracked here. Format: `[version] — date — description`.

---

## [0.1.0] — 2026-05-15 — Initial Release: Full AI Business OS

### Added — Core Architecture
- Next.js 16.2.6 application with App Router and TypeScript
- Supabase backend with 8 tables covering all business operations
- Anthropic Claude API integration (`claude-sonnet-4-6`) powering all agents
- Centralized `decisions` queue — the approve/skip engine for the entire OS

### Added — Database Schema (`supabase/migrations/001_initial_schema.sql`)
- `decisions` — agent-generated actions awaiting founder approval
- `candidates` — HR candidate pipeline with AI screening scores
- `leads` — sales CRM with AI priority scoring and follow-up drafts
- `invoices` — finance tracker with auto-computed `days_overdue`
- `content_pieces` — marketing content with performance tracking
- `seo_content` — keyword pipeline from research to published article
- `briefings` — CEO morning briefings stored daily
- `agent_logs` — full audit trail for every agent action
- Seed data included: 3 candidates, 4 leads, 5 invoices, 3 content pieces, 3 keywords

### Added — AI Agents (`src/lib/agents/`)
- **CEO Agent** (`ceo-agent.ts`)
  - Reads all 5 departments in parallel via Supabase
  - Generates structured morning briefing with mood, KPIs, alerts, tasks
  - Upserts daily briefing to `briefings` table
- **HR Agent** (`hr-agent.ts`)
  - Screens new candidates against role requirements (0–100 score)
  - Extracts strengths, weaknesses, recommendation, interview flag
  - Creates `schedule_interview` decisions for top candidates
  - Generates personalized interview invitation emails
- **Sales Agent** (`sales-agent.ts`)
  - Analyzes all active leads by stage, value, days-since-contact
  - Scores each lead 0–100 for urgency
  - Drafts hyper-personalized follow-up emails with subject lines
  - Creates decisions for high-priority and stale leads
- **Finance Agent** (`finance-agent.ts`)
  - Audits all unpaid and overdue invoices daily
  - Calculates exact days overdue per invoice
  - Drafts professional payment reminder emails
  - Creates decisions sorted by severity (critical → high → medium)
- **Marketing Agent** (`marketing-agent.ts`)
  - Analyzes published reel performance (views, likes, shares, saves)
  - Generates 5 hook variations per content piece with psychology notes
  - Writes optimized captions, CTAs, posting times, hashtags
  - Processes drafts into complete content briefs
- **SEO Agent** (`seo-agent.ts`)
  - Analyzes top-10 SERP competitors for any keyword (knowledge-based)
  - Identifies content gaps and competitor weaknesses
  - Generates comprehensive content briefs with outline, FAQs, secondary keywords
  - Drafts complete long-form articles (4,000–8,000 words) targeting primary search intent
  - Pipeline: `researching → briefed → drafted → approved → published`

### Added — API Routes (`src/app/api/`)
- `POST /api/agents/ceo` — generate morning briefing
- `GET  /api/agents/ceo` — fetch today's briefing
- `POST /api/agents/hr` — run candidate screening
- `GET  /api/agents/hr` — fetch candidates
- `POST /api/agents/sales` — analyze leads, draft follow-ups
- `GET  /api/agents/sales` — fetch leads
- `POST /api/agents/finance` — audit invoices
- `GET  /api/agents/finance` — fetch invoices
- `POST /api/agents/marketing` — analyze content / generate hooks
- `GET  /api/agents/marketing` — fetch content pieces
- `POST /api/agents/seo` — run SEO queue / research / draft
- `GET  /api/agents/seo` — fetch SEO pipeline
- `GET  /api/decisions` — fetch pending decisions (filterable by agent)
- `PATCH /api/decisions` — approve or skip a decision

### Added — UI Components (`src/components/`)
- `NavSidebar` — fixed left sidebar with live pending decision counts per agent
- `DecisionCard` — approve/skip card with expandable email drafts
- `BriefingCard` — CEO morning briefing with KPIs, alerts, tasks, department status
- `RunAgentButton` — one-click agent runner with live state feedback
- `StatCard` — KPI display card with variant coloring (default/danger/success/warning)

### Added — Pages (`src/app/`)
- `/` — CEO Dashboard: morning briefing + full decision queue + 4 KPI cards
- `/hr` — HR Module: candidate list with AI scores + interview decision queue
- `/sales` — Sales Module: lead pipeline with priority scores + follow-up queue
- `/finance` — Finance Module: invoice tracker with overdue flags + payment queue
- `/marketing` — Marketing Module: content performance + hook optimization queue
- `/seo` — SEO Module: keyword pipeline + competitor analysis + content approvals

### Added — Configuration
- `.env.example` — all required environment variables documented
- `next.config.ts` — Server Actions configured with allowed origins
- `src/lib/utils.ts` — shared helpers: `cn`, `formatCurrency`, `formatDate`, `formatRelative`, `agentColor`, `agentIcon`
- `src/types/index.ts` — full TypeScript types for all 8 database entities

---

## Roadmap — Planned for v0.2.0

- [ ] Email sending via Resend API (currently drafts only)
- [ ] Calendar integration for interview scheduling (Google Calendar API)
- [ ] Webhook endpoint for inbound leads (Typeform, Calendly)
- [ ] Ahrefs API integration for real SERP competitor data
- [ ] Instagram Graph API for real reel performance data
- [ ] Cron jobs via Vercel Cron for automated daily agent runs
- [ ] Notification system (Slack or WhatsApp) for critical alerts
- [ ] Multi-user auth with role-based access (Supabase Auth)
- [ ] Agent memory: learn from past approve/skip patterns

---

## Workflow Guide

### Daily Flow (What You Do)
1. Open `/` every morning
2. Click "▶ Run CEO agent" — generates briefing and pulls pending decisions
3. Review the briefing — understand the business in 30 seconds
4. Work through the Decision Queue — Approve or Skip each item
5. Run individual department agents as needed throughout the day

### Agent Run Order (Recommended)
```
Finance → (catches overdue invoices first — revenue protection)
Sales   → (prioritizes follow-ups before the day starts)
HR      → (screens new candidates overnight)
Marketing → (analyzes previous day's content performance)
SEO     → (researches and drafts content in background)
CEO     → (reads outputs from all agents, generates unified briefing)
```

### Data Flow
```
Supabase (live data)
    ↓
Agent reads table(s) via server-side Supabase client
    ↓
Claude (claude-sonnet-4-6) analyzes data + generates output
    ↓
Agent writes results back to Supabase (updates + new records)
    ↓
Agent creates decision(s) in `decisions` table
    ↓
UI renders pending decisions → Founder approves/skips
    ↓
Approval triggers downstream update (stage change, status update, etc.)
```

---

*Built with Claude Code (Anthropic) — claude-sonnet-4-6*
*Stack: Next.js 16 · TypeScript · Supabase · Tailwind CSS · Anthropic SDK*
