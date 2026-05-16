import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { platform, content_type, title, hook, body: contentBody, cta, status, views, likes, shares, saves, comments } = body

    if (!title && !hook) {
      return NextResponse.json({ success: false, error: 'Title or hook is required' }, { status: 400 })
    }

    const supabase = await createClient()
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
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
