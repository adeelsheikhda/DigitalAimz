import { NextResponse } from 'next/server'
import { generateMorningBriefing } from '@/lib/agents/ceo-agent'

export async function POST() {
  try {
    const result = await generateMorningBriefing()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const { data: briefing } = await supabase
    .from('briefings')
    .select('*')
    .eq('briefing_date', today)
    .single()

  return NextResponse.json({ success: true, data: briefing })
}
