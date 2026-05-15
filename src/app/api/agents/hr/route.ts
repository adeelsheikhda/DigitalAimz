import { NextResponse } from 'next/server'
import { screenCandidates } from '@/lib/agents/hr-agent'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const { decisions, processed } = await screenCandidates()

    if (decisions.length > 0) {
      const supabase = await createClient()
      await supabase.from('decisions').insert(
        decisions.map(d => ({
          agent: 'hr',
          title: d.title,
          description: d.description,
          action_type: 'schedule_interview',
          payload: d.payload,
          priority: (d.payload.score as number) ?? 50,
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
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ success: true, data })
}
