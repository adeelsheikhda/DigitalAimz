import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, position, resume_text } = body

    if (!name || !position) {
      return NextResponse.json({ success: false, error: 'Name and position are required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('candidates')
      .insert({ name, email, phone, position, resume_text, status: 'new' })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}
