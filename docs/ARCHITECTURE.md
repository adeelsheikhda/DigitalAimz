# Architecture — DigitalAimz AI Business OS

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalAimz AI OS                        │
├─────────────────────────────────────────────────────────────┤
│  Founder UI (Next.js 16)                                    │
│  ┌──────────┐ ┌──────┐ ┌─────────┐ ┌──────────┐           │
│  │  CEO     │ │  HR  │ │  Sales  │ │ Finance  │  ...       │
│  │Dashboard │ │ Page │ │  Page   │ │  Page    │            │
│  └──────────┘ └──────┘ └─────────┘ └──────────┘           │
│       ↕             ↕         ↕           ↕                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Routes (/api/agents/*)              │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↕                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Agent Layer (src/lib/agents/)              │   │
│  │  ceo · hr · sales · finance · marketing · seo       │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↕                        ↕                           │
│  ┌────────────────┐    ┌────────────────┐                  │
│  │  Supabase DB   │    │  Claude API    │                  │
│  │  (PostgreSQL)  │    │ claude-sonnet  │                  │
│  └────────────────┘    └────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. Agent reads live data from Supabase
       ↓
2. Builds structured context payload (JSON)
       ↓
3. Sends to Claude (claude-sonnet-4-6) with role-specific system prompt
       ↓
4. Claude returns structured JSON analysis + draft content
       ↓
5. Agent writes results back to Supabase (updates records)
       ↓
6. Agent inserts decision(s) into `decisions` table
       ↓
7. UI renders pending decisions to founder
       ↓
8. Founder clicks Approve or Skip
       ↓
9. Downstream update triggers (stage changes, status updates)
```

## Key Design Decisions

### Why a `decisions` table as the core?
Every agent output flows through one queue. The founder never touches raw data — only pre-processed, AI-summarized decisions. This is the "just approve or skip" promise.

### Why Server Components for pages?
All data fetching happens server-side via Supabase server client. No client-side data fetching waterfalls, no loading spinners on page load. Decisions are interactive via Server Actions.

### Why JSON responses from Claude?
All agents use `runAgentJSON<T>()` which enforces JSON-only output and parses into typed interfaces. Prevents hallucinated prose from entering the database.

### Why `claude-sonnet-4-6`?
Best balance of speed and quality for business analysis tasks. CEO briefing and SEO drafting use `maxTokens: 8192` for longer outputs.

## File Map

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar (SSR pending counts)
│   ├── page.tsx                # CEO Dashboard
│   ├── hr/page.tsx
│   ├── sales/page.tsx
│   ├── finance/page.tsx
│   ├── marketing/page.tsx
│   ├── seo/page.tsx
│   └── api/
│       ├── agents/ceo/route.ts
│       ├── agents/hr/route.ts
│       ├── agents/sales/route.ts
│       ├── agents/finance/route.ts
│       ├── agents/marketing/route.ts
│       ├── agents/seo/route.ts
│       └── decisions/route.ts
├── lib/
│   ├── agents/
│   │   ├── ceo-agent.ts
│   │   ├── hr-agent.ts
│   │   ├── sales-agent.ts
│   │   ├── finance-agent.ts
│   │   ├── marketing-agent.ts
│   │   └── seo-agent.ts
│   ├── claude.ts               # Anthropic client + runAgent / runAgentJSON
│   ├── supabase/client.ts      # Browser Supabase client
│   ├── supabase/server.ts      # Server Supabase client (uses cookies)
│   └── utils.ts                # cn, formatCurrency, formatDate, agentColor
├── components/
│   ├── nav-sidebar.tsx         # Fixed left nav with live badge counts
│   ├── decision-card.tsx       # Approve/Skip interactive card
│   ├── briefing-card.tsx       # CEO briefing display
│   ├── run-agent-button.tsx    # One-click agent trigger
│   └── stat-card.tsx           # KPI display card
└── types/index.ts              # TypeScript interfaces for all 8 entities
```
