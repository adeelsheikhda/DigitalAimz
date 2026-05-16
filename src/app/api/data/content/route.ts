import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { platform, content_type, title, hook, body: contentBody, cta, status, views, likes, shares, saves, comments } = body

    if (!title && !hook) {
      return NextResponse.json({ success: false, error: 'Title or hook is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('content_pieces')
      .insert({
        platform: platform || 'instagram',
        content_type: content_type || 'reel',
        title,
        hook,
        body: contentBody,
        cta,
        status: status || 'draft',
        performance: {
          views: parseInt(views) || 0,
          likes: parseInt(likes) || 0,
          shares: parseInt(shares) || 0,
          saves: parseInt(saves) || 0,
          comments: parseInt(comments) || 0,
        },
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
