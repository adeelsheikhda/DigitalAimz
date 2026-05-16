import { NextResponse } from 'next/server'
import { analyzLeads } from '@/lib/agents/sales-agent'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const { decisions, processed } = await analyzLeads()

    if (decisions.length > 0) {
      const supabase = await createClient()
      await supabase.from('decisions').insert(
        decisions.map(d => ({
          agent: 'sales',
          title: d.title,
          description: d.description,
          action_type: 'send_follow_up',
          payload: d.payload,
          priority: d.priority,
        }))
      )
    }

    return NextResponse.json({ success: true, data: { processed, decisions_created: decisions.length } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('ai_priority_score', { ascending: false })
    .limit(50)

  return NextResponse.json({ success: true, data })
}
