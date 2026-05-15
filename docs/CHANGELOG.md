# DigitalAimz AI Business OS — Changelog

All notable changes tracked here. Format: `[version] — date — description`.

---

## [0.1.0] — 2026-05-15 — Initial Release: Full AI Business OS

### Added — Core Architecture
- Next.js 16.2.6 application with App Router and TypeScript
- Supabase backend with 8 tables covering all business operations
- Anthropic Claude API integration (`claude-sonnet-4-6`) powering all agents
- Centralized `decisions` queue — the approve/skip engine for the entire OS

### Added — Database Schema
- `decisions` — agent-generated actions awaiting founder approval
- `candidates` — HR candidate pipeline with AI screening scores
- `leads` — sales CRM with AI priority scoring and follow-up drafts
- `invoices` — finance tracker with auto-computed `days_overdue`
- `content_pieces` — marketing content with performance tracking
- `seo_content` — keyword pipeline from research to published article
- `briefings` — CEO morning briefings stored daily
- `agent_logs` — full audit trail for every agent action
- Seed data: 3 candidates, 4 leads, 5 invoices, 3 content pieces, 3 keywords

### Added — AI Agents
- **CEO Agent** — reads all 5 departments, generates morning briefing with mood/KPIs/alerts/tasks
- **HR Agent** — screens resumes 0–100 score, extracts strengths/weaknesses, schedules interviews
- **Sales Agent** — priority-scores leads, drafts personalized follow-up emails per lead
- **Finance Agent** — audits overdue invoices by severity, drafts payment reminders
- **Marketing Agent** — analyzes reel performance, generates 5 hook variations with psychology notes
- **SEO Agent** — competitor analysis, content briefs, full article drafts to rank #1 with 0 backlinks

### Added — API Routes
- `POST/GET /api/agents/ceo` — generate and fetch daily briefing
- `POST/GET /api/agents/hr` — screen candidates / fetch list
- `POST/GET /api/agents/sales` — analyze leads / fetch list
- `POST/GET /api/agents/finance` — audit invoices / fetch list
- `POST/GET /api/agents/marketing` — analyze content / fetch list
- `POST/GET /api/agents/seo` — run research+draft pipeline / fetch list
- `GET/PATCH /api/decisions` — fetch pending decisions / approve or skip

### Added — UI
- CEO Dashboard: morning briefing + decision queue + 4 KPI cards
- HR Module: candidate list with AI scores + interview decision queue
- Sales Module: lead pipeline with priority scores + follow-up queue
- Finance Module: invoice tracker with overdue flags + payment queue
- Marketing Module: content performance + hook optimization queue
- SEO Module: keyword pipeline + competitor analysis + content approvals
- `NavSidebar` with live pending decision counts per agent
- `DecisionCard` with expandable email drafts (approve/skip)
- `BriefingCard` with KPIs, alerts, tasks, department status
- `RunAgentButton` — one-click agent runner with live feedback
- `StatCard` — KPI cards with danger/success/warning variants

---

## Roadmap — v0.2.0

- [ ] Email sending via Resend API (currently drafts only)
- [ ] Calendar integration for interview scheduling
- [ ] Webhook endpoint for inbound leads (Typeform, Calendly)
- [ ] Ahrefs API for real SERP competitor data
- [ ] Instagram Graph API for real reel performance data
- [ ] Vercel Cron for automated daily agent runs at 7am
- [ ] Slack/WhatsApp notifications for critical alerts
- [ ] Multi-user auth with role-based access (Supabase Auth)
- [ ] Agent memory: learn from past approve/skip patterns
