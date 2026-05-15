# Database Schema — DigitalAimz AI Business OS

All tables live in Supabase (PostgreSQL). Schema file: `supabase/migrations/001_initial_schema.sql`

---

## `decisions` — The Core Queue

Every agent output flows through this table. The founder only interacts with this table through the UI.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `agent` | VARCHAR(20) | ceo / hr / sales / finance / marketing / seo |
| `title` | TEXT | Short decision title shown in the card |
| `description` | TEXT | Full context, analysis, reasoning |
| `action_type` | VARCHAR(50) | What action this decision represents |
| `payload` | JSONB | Structured data (email drafts, IDs, etc.) |
| `status` | VARCHAR(20) | pending / approved / skipped |
| `priority` | INTEGER | 0–100, higher = shown first |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `decided_at` | TIMESTAMPTZ | Set when founder acts |
| `outcome` | JSONB | Optional outcome data |

---

## `candidates` — HR Pipeline

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Full name |
| `email` | TEXT | Contact email |
| `position` | TEXT | Role applied for |
| `resume_text` | TEXT | Full resume text (paste or parsed) |
| `ai_score` | INTEGER | 0–100 AI screening score |
| `ai_summary` | TEXT | 2–3 sentence executive summary |
| `strengths` | JSONB | Array of strength strings |
| `weaknesses` | JSONB | Array of weakness strings |
| `status` | VARCHAR(30) | new / screened / interview_scheduled / rejected / hired |
| `interview_time` | TIMESTAMPTZ | Scheduled interview time |

---

## `leads` — Sales CRM

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Lead name |
| `company` | TEXT | Company name |
| `email` | TEXT | Email |
| `source` | TEXT | Where they came from |
| `stage` | VARCHAR(30) | new / contacted / qualified / proposal / negotiation / won / lost |
| `value` | DECIMAL(12,2) | Deal value in USD |
| `last_contact` | TIMESTAMPTZ | Last touchpoint |
| `notes` | TEXT | Manual notes |
| `ai_follow_up` | TEXT | Claude-drafted follow-up email |
| `ai_priority_score` | INTEGER | 0–100 urgency score |

---

## `invoices` — Finance Tracker

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client` | TEXT | Client name |
| `amount` | DECIMAL(12,2) | Invoice amount |
| `currency` | VARCHAR(5) | Default USD |
| `due_date` | DATE | Payment due date |
| `issued_date` | DATE | Invoice issued date |
| `status` | VARCHAR(20) | unpaid / paid / overdue / flagged / disputed |
| `invoice_number` | TEXT | Human-readable invoice ID (unique) |
| `items` | JSONB | Line items array |
| `ai_flag` | TEXT | Claude's collection strategy |
| `days_overdue` | INTEGER | **Computed column** — auto-calculates |

---

## `content_pieces` — Marketing Content

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `platform` | VARCHAR(30) | instagram / tiktok / youtube / linkedin / twitter |
| `content_type` | VARCHAR(30) | reel / post / story / caption / hook / thread |
| `title` | TEXT | Content title |
| `hook` | TEXT | Opening hook line |
| `body` | TEXT | Full content body |
| `cta` | TEXT | Call to action |
| `status` | VARCHAR(20) | draft / approved / published / archived |
| `performance` | JSONB | `{views, likes, shares, saves, comments}` |
| `ai_analysis` | TEXT | Performance analysis from Claude |
| `ai_hook_suggestions` | JSONB | Array of 5 hook variation strings |

---

## `seo_content` — SEO Pipeline

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `keyword` | TEXT | Target keyword |
| `search_volume` | INTEGER | Monthly searches |
| `keyword_difficulty` | INTEGER | 0–100 KD score |
| `competitor_urls` | JSONB | Top competitor URLs |
| `competitor_analysis` | JSONB | Structured competitor breakdown |
| `content_brief` | TEXT | Full JSON content brief |
| `draft_content` | TEXT | Complete article in markdown |
| `word_count` | INTEGER | Article word count |
| `search_intent` | VARCHAR(30) | informational / commercial / transactional / navigational |
| `estimated_rank_potential` | INTEGER | 1–100 |
| `status` | VARCHAR(20) | researching / briefed / drafted / approved / published |

---

## `briefings` — CEO Daily Records

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `briefing_date` | DATE | Unique per day |
| `summary` | TEXT | Executive summary |
| `hr_summary` | TEXT | HR department status |
| `sales_summary` | TEXT | Sales department status |
| `finance_summary` | TEXT | Finance department status |
| `marketing_summary` | TEXT | Marketing department status |
| `seo_summary` | TEXT | SEO department status |
| `tasks_assigned` | JSONB | Array of `{department, task, priority, due}` |
| `kpis` | JSONB | Key metrics snapshot |
| `alerts` | JSONB | Array of `{level, department, message}` |

---

## `agent_logs` — Audit Trail

Every agent action is logged here for debugging and history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `agent` | VARCHAR(20) | Which agent ran |
| `action` | TEXT | What action was performed |
| `details` | JSONB | Structured details |
| `success` | BOOLEAN | Did it succeed |
| `error_message` | TEXT | Error if failed |
| `duration_ms` | INTEGER | Execution time |
