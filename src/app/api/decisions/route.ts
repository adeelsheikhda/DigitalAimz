import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'
  const agent = searchParams.get('agent')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const supabase = await createClient()

  let query = supabase
    .from('decisions')
    .select('*')
    .eq('status', status)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (agent) query = query.eq('agent', agent)

  const { data, error } = await query

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, status, outcome } = body

  if (!id || !['approved', 'skipped'].includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decisions')
    .update({
      status,
      decided_at: new Date().toISOString(),
      outcome: outcome ?? {},
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  await supabase.from('agent_logs').insert({
    agent: data.agent,
    action: `decision_${status}`,
    details: { decision_id: id, title: data.title },
    success: true,
  })

  return NextResponse.json({ success: true, data })
}
