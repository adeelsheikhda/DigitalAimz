import { NextResponse } from 'next/server'
import { runSeoQueue, researchKeyword, draftContent } from '@/lib/agents/seo-agent'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.action === 'research' && body.keyword_id) {
      const result = await researchKeyword(body.keyword_id)
      return NextResponse.json({ success: true, data: result })
    }

    if (body.action === 'draft' && body.keyword_id) {
      const content = await draftContent(body.keyword_id)
      return NextResponse.json({ success: true, data: { content } })
    }

    const { decisions, processed } = await runSeoQueue()

    if (decisions.length > 0) {
      const supabase = await createClient()
      await supabase.from('decisions').insert(
        decisions.map(d => ({
          agent: 'seo',
          title: d.title,
          description: d.description,
          action_type: 'approve_content_brief',
          payload: d.payload,
          priority: 70,
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
    .from('seo_content')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ success: true, data })
}
