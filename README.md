# DigitalAimz — AI Business OS

> Claude = Full business team.

An AI-powered operating system for your entire company. Six specialized Claude agents run your business. You just approve or skip.

## Agents

| Agent | What it does |
|-------|-------------|
| 👑 **CEO** | Morning briefing — reads all departments, assigns tasks, flags alerts |
| 🧑‍💼 **HR** | Screens resumes, scores candidates 0–100, schedules interviews |
| 💰 **Sales** | Prioritizes leads, drafts personalized follow-up emails |
| 📊 **Finance** | Flags overdue invoices, drafts payment reminders |
| 📱 **Marketing** | Analyzes reel performance, generates 5 hook variations |
| 🔍 **SEO** | Competitor analysis, content briefs, full article drafts to rank #1 with 0 backlinks |

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude (`claude-sonnet-4-6`)
- **Auth**: Supabase (ready to enable)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/adeelsheikhda/digitalaimz.git
cd digitalaimz
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Set up Supabase

Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.
This creates all 8 tables + seeds demo data.

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`

## How to Use

1. Open the app every morning
2. Click **▶ Run CEO agent** → get a 30-second briefing on your entire business
3. Work through the **Decision Queue** → Approve or Skip each AI recommendation
4. Run individual department agents to generate new decisions at any time

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # CEO Dashboard
│   ├── hr/page.tsx           # HR Module
│   ├── sales/page.tsx        # Sales Module
│   ├── finance/page.tsx      # Finance Module
│   ├── marketing/page.tsx    # Marketing Module
│   ├── seo/page.tsx          # SEO Module
│   └── api/agents/           # Agent API routes
├── lib/
│   ├── agents/               # All 6 agent implementations
│   ├── claude.ts             # Anthropic client
│   └── supabase/             # Supabase clients
├── components/               # UI components
└── types/                    # TypeScript types
supabase/
└── migrations/               # Database schema + seed data
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full release notes and workflow documentation.
