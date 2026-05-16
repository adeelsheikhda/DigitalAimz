import { NextResponse } from 'next/server'
import { analyzeContent, generateReelHooks } from '@/lib/agents/marketing-agent'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.topic) {
      const hooks = await generateReelHooks(body.topic, body.platform ?? 'Instagram')
      return NextResponse.json({ success: true, data: hooks })
    }

    const { decisions, processed } = await analyzeContent()

    if (decisions.length > 0) {
      const supabase = await createClient()
      await supabase.from('decisions').insert(
        decisions.map(d => ({
          agent: 'marketing',
          title: d.title,
          description: d.description,
          action_type: 'approve_content',
          payload: d.payload,
          priority: 50,
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
    .from('content_pieces')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ success: true, data })
}
