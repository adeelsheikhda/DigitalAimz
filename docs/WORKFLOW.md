# Daily Operating Workflow — DigitalAimz AI Business OS

This is how the system is designed to be used every day.

---

## The Promise

> You open the app. You see what matters. You decide. You close the app.

No manual data entry. No chasing down status. No thinking about what to do next. The agents handle all of that.

---

## Daily Flow (7–8 Minutes)

### 1. Open the CEO Dashboard (`/`)

### 2. Run the CEO Agent
Click **▶ Run CEO agent**. Wait ~10 seconds.

You now have:
- A mood indicator (excellent / good / concerning / critical)
- A 4-sentence briefing on the whole business
- The single highest-leverage thing to focus on today
- All critical alerts flagged by department
- Tasks assigned to each department

### 3. Work the Decision Queue
The queue shows everything pending from all agents — sorted by priority (highest first).

For each card:
- Read the title and description
- Expand to see the email draft if relevant
- **Approve** = execute the action (stage changes, status updates happen automatically)
- **Skip** = dismiss for now, nothing changes in the database

### 4. Done
That's it. The agents have done the analysis, the drafting, the prioritization. You just decide.

---

## Weekly Flow

### Monday
- Run all agents to start the week fresh
- Pay special attention to Finance (invoices due this week)
- Check Sales pipeline — any deals stuck too long?

### Wednesday
- Run Marketing agent — analyze mid-week content performance
- Run SEO agent — check if any briefs are ready to draft

### Friday
- Run CEO agent for weekly summary
- Approve any pending SEO content for publishing
- Review HR pipeline — any interviews to schedule?

---

## Agent Run Order (Recommended)

```
1. Finance   → catches overdue invoices first — revenue protection
2. Sales     → prioritizes follow-ups before the day starts
3. HR        → screens overnight candidate applications
4. Marketing → analyzes previous day's content performance
5. SEO       → researches and drafts content (slowest — runs in background)
6. CEO       → reads outputs from all agents, generates unified briefing
```

You can run them in any order. The CEO agent always gives the most value after the others have run.

---

## Understanding Decisions

| Action Type | What it means | On Approve |
|------------|---------------|------------|
| `schedule_interview` | HR found a strong candidate | Candidate status → interview_scheduled |
| `send_follow_up` | Sales agent drafted an email | Lead stage advances, last_contact updates |
| `send_payment_reminder` | Finance flagged overdue invoice | Invoice status → flagged |
| `approve_content` | Marketing optimized a reel | Content piece status → approved |
| `approve_content_brief` | SEO brief is ready | SEO item status → approved |

---

## Adding Data

The system reads from Supabase. Add data directly via:
- **Supabase Dashboard** → Table Editor
- **Supabase SQL Editor** — run INSERT statements
- **API** (build intake forms that write directly to Supabase)

Once data is in Supabase, run the relevant agent and decisions appear automatically.

---

## Costs

Approximate Claude API cost per agent run:
- CEO Agent: ~$0.03–0.06 (reads everything, long output)
- HR Agent (per candidate): ~$0.01–0.02
- Sales Agent (per lead): ~$0.01–0.02
- Finance Agent (per invoice): ~$0.005–0.01
- Marketing Agent (per piece): ~$0.02–0.04
- SEO Agent research: ~$0.03–0.05
- SEO Agent draft (full article): ~$0.08–0.15

Running all agents daily: ~$0.20–0.50/day depending on data volume.

---

## Troubleshooting

**Agent runs but no decisions appear?**
- Check there is data in the relevant table (candidates, leads, invoices, etc.)
- Check Supabase credentials in `.env.local`
- Check `agent_logs` table for error details

**"Error" badge on Run Agent button?**
- Check `ANTHROPIC_API_KEY` is set correctly
- Check browser console for the error response

**Page shows no data?**
- Confirm `supabase/migrations/001_initial_schema.sql` was run successfully
- Check Supabase dashboard — are the tables there?

**TypeScript errors?**
```bash
npm run tsc --noEmit
```
