import { runAgentJSON } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/types'

interface SalesAnalysis {
  priority_score: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  follow_up_email: string
  follow_up_subject: string
  recommended_action: string
  next_stage: string
  reasoning: string
}

export async function analyzLeads(): Promise<{
  decisions: Array<{ title: string; description: string; priority: number; payload: Record<string, unknown> }>
  processed: number
}> {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .not('stage', 'in', '("won","lost")')
    .order('created_at', { ascending: false })
    .limit(15)

  if (!leads?.length) return { decisions: [], processed: 0 }

  const decisions = []

  for (const lead of leads as Lead[]) {
    const daysSinceContact = lead.last_contact
      ? Math.floor((Date.now() - new Date(lead.last_contact).getTime()) / 86400000)
      : 999

    const result = await runAgentJSON<SalesAnalysis>(
      `You are an elite sales strategist for DigitalAimz, a digital marketing and SEO agency.
Your clients are businesses that need SEO, social media, and content marketing.
You analyze leads and craft hyper-personalized follow-ups that convert.
Always be direct, value-driven, never pushy.`,
      `Analyze this lead and draft a follow-up:

Name: ${lead.name}
Company: ${lead.company ?? 'Unknown'}
Email: ${lead.email ?? 'N/A'}
Source: ${lead.source ?? 'Unknown'}
Current Stage: ${lead.stage}
Deal Value: $${lead.value ?? 0}
Days Since Last Contact: ${daysSinceContact}
Notes: ${lead.notes ?? 'No notes'}

Return JSON:
{
  "priority_score": <0-100>,
  "urgency": "<critical|high|medium|low>",
  "follow_up_subject": "<email subject line>",
  "follow_up_email": "<full personalized email body>",
  "recommended_action": "<specific next step>",
  "next_stage": "<suggested pipeline stage>",
  "reasoning": "<1-2 sentences why>"
}`
    )

    await supabase
      .from('leads')
      .update({
        ai_follow_up: result.follow_up_email,
        ai_priority_score: result.priority_score,
      })
      .eq('id', lead.id)

    if (result.urgency === 'critical' || result.urgency === 'high' || daysSinceContact > 5) {
      decisions.push({
        title: `Follow up: ${lead.name} @ ${lead.company} — ${result.urgency.toUpperCase()}`,
        description: `${result.reasoning}\n\nRecommended Action: ${result.recommended_action}\n\nDays since contact: ${daysSinceContact} | Value: $${lead.value ?? 0}`,
        priority: result.priority_score,
        payload: {
          lead_id: lead.id,
          lead_name: lead.name,
          lead_email: lead.email,
          company: lead.company,
          subject: result.follow_up_subject,
          email_draft: result.follow_up_email,
          recommended_action: result.recommended_action,
          next_stage: result.next_stage,
          priority_score: result.priority_score,
        },
      })
    }
  }

  await supabase.from('agent_logs').insert({
    agent: 'sales',
    action: 'analyze_leads',
    details: { processed: leads.length, decisions_created: decisions.length },
    success: true,
  })

  return { decisions, processed: leads.length }
}
