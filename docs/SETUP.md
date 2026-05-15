# Setup Guide — DigitalAimz AI Business OS

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- An Anthropic account with API key

---

## Step 1: Clone and Install

```bash
git clone https://github.com/adeelsheikhda/digitalaimz.git
cd digitalaimz
git checkout claude/ai-business-os-tZ71F
npm install
```

---

## Step 2: Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **SQL Editor**
3. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** — this creates all 8 tables + seeds demo data

### Get your credentials
- Go to **Settings → API**
- Copy: `Project URL` and `anon public` key

---

## Step 3: Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create new key
3. Copy the key (starts with `sk-ant-`)

---

## Step 4: Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Run

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the CEO Dashboard with demo data loaded.

---

## Step 6: First Run

1. Click **▶ Run CEO agent** on the dashboard
2. Wait ~10 seconds for Claude to generate your first briefing
3. The Decision Queue will populate with items from all departments
4. Click **Finance agent** → run it to generate invoice alerts
5. Click **Sales agent** → run it to generate follow-up drafts

---

## Deploying to Production (Vercel)

```bash
npm install -g vercel
vercel deploy
```

Set all environment variables in Vercel dashboard (same as `.env.local`).

For `NEXT_PUBLIC_APP_URL`, use your Vercel deployment URL.

---

## Adding Real Data

### Add a candidate
Insert into `candidates` table via Supabase dashboard:
```sql
INSERT INTO candidates (name, email, position, resume_text)
VALUES ('Name', 'email@example.com', 'Role Title', 'Full resume text here...');
```
Then run the HR agent to screen them.

### Add a lead
```sql
INSERT INTO leads (name, company, email, source, stage, value, notes)
VALUES ('Lead Name', 'Company', 'email@co.com', 'LinkedIn', 'new', 5000, 'Notes here');
```

### Add an invoice
```sql
INSERT INTO invoices (client, amount, due_date, issued_date, invoice_number)
VALUES ('Client Name', 2500.00, '2026-05-30', '2026-05-01', 'INV-2026-050');
```

### Add a keyword to research
```sql
INSERT INTO seo_content (keyword, search_volume, keyword_difficulty, search_intent)
VALUES ('your target keyword', 2000, 35, 'informational');
```
Then run the SEO agent to research it.
