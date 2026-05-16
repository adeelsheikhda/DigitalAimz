import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, search_volume, keyword_difficulty, search_intent } = body

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('seo_content')
      .insert({
        keyword,
        search_volume: search_volume ? parseInt(search_volume) : null,
        keyword_difficulty: keyword_difficulty ? parseInt(keyword_difficulty) : null,
        search_intent: search_intent || 'informational',
        status: 'researching',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}
