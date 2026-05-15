import { runAgentJSON } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { BriefingTask, BriefingAlert } from '@/types'

interface CEOBriefingData {
  summary: string
  alerts: BriefingAlert[]
  tasks: BriefingTask[]
  kpis: Record<string, number | string>
  hr_summary: string
  sales_summary: string
  finance_summary: string
  marketing_summary: string
  seo_summary: string
  mood: 'excellent' | 'good' | 'concerning' | 'critical'
  one_thing_to_focus: string
}

export async function generateMorningBriefing(): Promise<{
  briefing: CEOBriefingData
  saved_id: string
}> {
  const supabase = await createClient()

  const [
    { data: candidates },
    { data: leads },
    { data: invoices },
    { data: content },
    { data: seoItems },
    { data: pendingDecisions },
  ] = await Promise.all([
    supabase.from('candidates').select('id,name,position,ai_score,status').order('created_at', { ascending: false }).limit(10),
    supabase.from('leads').select('id,name,company,stage,value,last_contact,ai_priority_score').not('stage', 'in', '("won","lost")'),
    supabase.from('invoices').select('id,client,amount,currency,status,due_date,days_overdue').not('status', 'eq', 'paid'),
    supabase.from('content_pieces').select('id,title,platform,status,performance').order('created_at', { ascending: false }).limit(10),
    supabase.from('seo_content').select('id,keyword,status,estimated_rank_potential').order('created_at', { ascending: false }).limit(10),
    supabase.from('decisions').select('id,agent,title,priority').eq('status', 'pending').order('priority', { ascending: false }),
  ])

  const overdueInvoices = (invoices ?? []).filter(i => i.status === 'overdue')
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0)
  const pipelineValue = (leads ?? []).reduce((sum, l) => sum + Number(l.value ?? 0), 0)
  const avgLeadScore = leads?.length
    ? Math.round((leads ?? []).reduce((s, l) => s + (l.ai_priority_score ?? 0), 0) / leads.length)
    : 0
  const topReel = (content ?? []).find(c => c.status === 'published')
  const topReelViews = (topReel?.performance as { views?: number })?.views ?? 0

  const contextPayload = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    hr: {
      total_candidates: candidates?.length ?? 0,
      new_candidates: (candidates ?? []).filter(c => c.status === 'new').length,
      screened: (candidates ?? []).filter(c => c.status === 'screened').length,
      top_candidate: (candidates ?? []).sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0))[0],
    },
    sales: {
      total_leads: leads?.length ?? 0,
      pipeline_value: pipelineValue,
      avg_priority_score: avgLeadScore,
      hot_leads: (leads ?? []).filter(l => (l.ai_priority_score ?? 0) >= 70).length,
      by_stage: ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].reduce((acc, stage) => ({
        ...acc,
        [stage]: (leads ?? []).filter(l => l.stage === stage).length,
      }), {}),
    },
    finance: {
      overdue_count: overdueInvoices.length,
      overdue_amount: overdueAmount,
      total_outstanding: (invoices ?? []).reduce((s, i) => s + Number(i.amount), 0),
      critical_invoices: overdueInvoices.filter(i => i.days_overdue > 30).map(i => ({
        client: i.client,
        amount: i.amount,
        days_overdue: i.days_overdue,
      })),
    },
    marketing: {
      published_pieces: (content ?? []).filter(c => c.status === 'published').length,
      drafts: (content ?? []).filter(c => c.status === 'draft').length,
      top_reel_views: topReelViews,
      approved_ready: (content ?? []).filter(c => c.status === 'approved').length,
    },
    seo: {
      keywords_tracked: seoItems?.length ?? 0,
      researching: (seoItems ?? []).filter(s => s.status === 'researching').length,
      drafted: (seoItems ?? []).filter(s => s.status === 'drafted').length,
      approved: (seoItems ?? []).filter(s => s.status === 'approved').length,
    },
    decisions: {
      pending_count: pendingDecisions?.length ?? 0,
      by_agent: ['ceo', 'hr', 'sales', 'finance', 'marketing', 'seo'].reduce((acc, agent) => ({
        ...acc,
        [agent]: (pendingDecisions ?? []).filter(d => d.agent === agent).length,
      }), {}),
    },
  }

  const briefing = await runAgentJSON<CEOBriefingData>(
    `You are the AI CEO of DigitalAimz, a digital marketing and SEO agency.
Every morning you deliver a razor-sharp briefing to the founder.
Your briefing is direct, data-driven, and action-oriented.
You don't sugarcoat. You don't pad. You identify what matters most right now.
Always think: what does the founder need to act on TODAY?`,
    `Generate today's morning briefing based on this live business data:

${JSON.stringify(contextPayload, null, 2)}

Return JSON:
{
  "mood": "<excellent|good|concerning|critical>",
  "summary": "<3-4 sentence executive summary. Start with the most important thing.>",
  "one_thing_to_focus": "<single highest-leverage action for today>",
  "alerts": [
    {"level": "<critical|warning|info>", "department": "<agent>", "message": "<specific alert>"}
  ],
  "tasks": [
    {"department": "<agent>", "task": "<specific task>", "priority": "<high|medium|low>", "due": "<today|this week|this month>"}
  ],
  "kpis": {
    "pipeline_value": <number>,
    "overdue_amount": <number>,
    "pending_decisions": <number>,
    "leads_count": <number>,
    "content_published": <number>
  },
  "hr_summary": "<1-2 sentence HR status>",
  "sales_summary": "<1-2 sentence sales status>",
  "finance_summary": "<1-2 sentence finance status>",
  "marketing_summary": "<1-2 sentence marketing status>",
  "seo_summary": "<1-2 sentence SEO status>"
}`
  )

  const today = new Date().toISOString().split('T')[0]
  const { data: saved } = await supabase
    .from('briefings')
    .upsert({
      briefing_date: today,
      summary: briefing.summary,
      hr_summary: briefing.hr_summary,
      sales_summary: briefing.sales_summary,
      finance_summary: briefing.finance_summary,
      marketing_summary: briefing.marketing_summary,
      seo_summary: briefing.seo_summary,
      tasks_assigned: briefing.tasks,
      kpis: briefing.kpis,
      alerts: briefing.alerts,
    }, { onConflict: 'briefing_date' })
    .select('id')
    .single()

  await supabase.from('agent_logs').insert({
    agent: 'ceo',
    action: 'generate_briefing',
    details: { date: today, alerts_count: briefing.alerts.length, tasks_count: briefing.tasks.length },
    success: true,
  })

  return { briefing, saved_id: saved?.id ?? '' }
}
