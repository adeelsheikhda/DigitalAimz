# Agent Reference — DigitalAimz AI Business OS

Each agent is a TypeScript module in `src/lib/agents/` that:
1. Reads live data from Supabase
2. Sends structured context to Claude (`claude-sonnet-4-6`)
3. Writes results back to Supabase
4. Creates decisions in the `decisions` table

---

## 👑 CEO Agent (`ceo-agent.ts`)

**Trigger**: `POST /api/agents/ceo`
**Reads**: candidates, leads, invoices, content_pieces, seo_content, decisions (all in parallel)
**Writes**: `briefings` table (upserts today's briefing)

### What it produces
- `mood` — excellent / good / concerning / critical
- `summary` — 3–4 sentence executive overview, most important thing first
- `one_thing_to_focus` — single highest-leverage action for the day
- `alerts` — critical / warning / info flags from any department
- `tasks` — specific tasks assigned to each department with priority and due date
- `kpis` — pipeline value, overdue amount, pending decisions, lead count, content count
- Per-department 2-sentence status summaries

### System prompt role
> "You are the AI CEO of DigitalAimz. Every morning you deliver a razor-sharp briefing. You don't sugarcoat. You don't pad. You identify what matters most right now."

---

## 🧑‍💼 HR Agent (`hr-agent.ts`)

**Trigger**: `POST /api/agents/hr`
**Reads**: `candidates` where `status = 'new'`
**Writes**: candidate record (score, summary, strengths, weaknesses, status → 'screened')
**Creates decisions**: `schedule_interview` for candidates where `interview_suggested = true`

### Scoring output
```json
{
  "score": 87,
  "summary": "Strong background in...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "..."],
  "recommendation": "strong_hire | hire | maybe | pass",
  "interview_suggested": true
}
```

### Decision payload
Contains `candidate_id`, `candidate_name`, `candidate_email`, `position`, `score`, `recommendation`. On approval → status updates to `interview_scheduled`.

---

## 💰 Sales Agent (`sales-agent.ts`)

**Trigger**: `POST /api/agents/sales`
**Reads**: `leads` where stage not in (won, lost)
**Writes**: lead record (`ai_follow_up`, `ai_priority_score`)
**Creates decisions**: for leads with urgency = critical/high OR days since contact > 5

### Priority scoring
- 0–100 score based on: deal value, stage, days since contact, source quality
- Urgency: critical / high / medium / low
- `next_stage` — suggested pipeline stage advancement

### Decision payload
Contains `lead_id`, `lead_email`, `subject`, `email_draft`, `next_stage`. On approval → lead stage advances, `last_contact` updates to now.

---

## 📊 Finance Agent (`finance-agent.ts`)

**Trigger**: `POST /api/agents/finance`
**Reads**: `invoices` where status ≠ 'paid'
**Writes**: invoice status → 'overdue', `ai_flag` with collection strategy
**Creates decisions**: for invoices overdue OR due within 3 days

### Priority calculation
`priority = min(100, 50 + days_overdue × 2)` — escalates automatically over time

### Severity levels
- `critical` — >30 days overdue
- `high` — 1–30 days overdue
- `medium` — due within 3 days

### Decision payload
Contains `invoice_id`, `client`, `amount`, `days_overdue`, `subject`, `email_draft`, `action`. On approval → invoice status → 'flagged'.

---

## 📱 Marketing Agent (`marketing-agent.ts`)

**Trigger**: `POST /api/agents/marketing`
**Reads**: published content (last 5) + draft content (last 5)
**Writes**: `ai_analysis` + `ai_hook_suggestions` on each piece
**Creates decisions**: hook optimizations for published + briefs for drafts

### Hook analysis output
```json
{
  "performance_rating": 78,
  "what_worked": ["..."],
  "what_failed": ["..."],
  "hook_variations": [
    {"hook": "...", "psychology": "...", "score": 92}
  ],
  "caption": "...",
  "cta": "...",
  "best_time_to_post": "...",
  "hashtags": ["..."]
}
```

### On-demand hook generation
`POST /api/agents/marketing` with `{ topic, platform }` generates hooks without creating a decision.

---

## 🔍 SEO Agent (`seo-agent.ts`)

**Trigger**: `POST /api/agents/seo`
**Reads**: `seo_content` where `status = 'researching'` (up to 3)
**Pipeline**: researching → briefed → drafted → approved → published

### Phase 1: `researchKeyword(keywordId)`
- Analyzes top-10 SERP archetypes for the keyword
- Identifies content gaps and competitor weaknesses
- Generates full content brief: title, meta, outline, FAQs, secondary keywords
- Writes to `competitor_analysis` + `content_brief` + status → 'briefed'
- Creates decision: "Approve content brief"

### Phase 2: `draftContent(keywordId)`
- Reads approved brief
- Drafts complete article (4,000–8,000 words) in markdown
- Targets primary search intent with topical authority approach
- Writes to `draft_content` + `word_count` + status → 'drafted'

### Ranking strategy (0 backlinks)
The agent targets primary search intent dominance:
1. Identify exact user intent (informational / commercial / transactional)
2. Find gaps in top-10 content (what they don't cover)
3. Create content that is more comprehensive, more specific, better structured
4. Use FAQs to capture PAA (People Also Ask) snippets
5. Write for human readers first — Google rewards engagement signals
