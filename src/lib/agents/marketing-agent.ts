import { runAgentJSON } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { ContentPiece } from '@/types'

interface HookAnalysis {
  performance_rating: number
  what_worked: string[]
  what_failed: string[]
  hook_variations: Array<{ hook: string; psychology: string; score: number }>
  caption: string
  cta: string
  best_time_to_post: string
  hashtags: string[]
}

interface ContentBrief {
  title: string
  hook: string
  body_outline: string[]
  cta: string
  platform_tips: string[]
  estimated_performance: string
}

export async function analyzeContent(): Promise<{
  decisions: Array<{ title: string; description: string; payload: Record<string, unknown> }>
  processed: number
}> {
  const supabase = await createClient()

  const { data: published } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: drafts } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('status', 'draft')
    .limit(5)

  const decisions = []

  // Analyze published content performance
  for (const piece of (published ?? []) as ContentPiece[]) {
    const perf = piece.performance
    const engagementRate = perf.views > 0
      ? ((perf.likes + perf.comments + perf.shares + perf.saves) / perf.views * 100).toFixed(2)
      : '0'

    const result = await runAgentJSON<HookAnalysis>(
      `You are a world-class social media strategist and copywriter.
You understand viral content psychology, platform algorithms, and what makes people stop scrolling.
You write hooks that hit like a punch — direct, specific, impossible to ignore.
You understand DigitalAimz is a personal brand in the digital marketing / SEO space.`,
      `Analyze this content piece and generate optimized hooks:

Title: ${piece.title ?? 'Untitled'}
Platform: ${piece.platform}
Type: ${piece.content_type}
Current Hook: "${piece.hook ?? 'None'}"
Performance: ${perf.views} views | ${perf.likes} likes | ${perf.shares} shares | ${perf.saves} saves | ${engagementRate}% engagement

Return JSON:
{
  "performance_rating": <0-100>,
  "what_worked": ["<insight 1>", "<insight 2>"],
  "what_failed": ["<issue 1>", "<issue 2>"],
  "hook_variations": [
    {"hook": "<hook text>", "psychology": "<why it works>", "score": <0-100>},
    {"hook": "<hook text>", "psychology": "<why it works>", "score": <0-100>},
    {"hook": "<hook text>", "psychology": "<why it works>", "score": <0-100>},
    {"hook": "<hook text>", "psychology": "<why it works>", "score": <0-100>},
    {"hook": "<hook text>", "psychology": "<why it works>", "score": <0-100>}
  ],
  "caption": "<full optimized caption>",
  "cta": "<strong call to action>",
  "best_time_to_post": "<optimal posting time>",
  "hashtags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"]
}`
    )

    await supabase
      .from('content_pieces')
      .update({
        ai_analysis: `Performance: ${result.performance_rating}/100\nWorked: ${result.what_worked.join(', ')}\nIssues: ${result.what_failed.join(', ')}`,
        ai_hook_suggestions: result.hook_variations.map(h => h.hook),
      })
      .eq('id', piece.id)

    decisions.push({
      title: `Hook optimization: "${piece.title ?? piece.hook?.slice(0, 50)}"`,
      description: `Performance score: ${result.performance_rating}/100\nTop hook: "${result.hook_variations[0]?.hook}"\nPsychology: ${result.hook_variations[0]?.psychology}`,
      payload: {
        piece_id: piece.id,
        platform: piece.platform,
        content_type: piece.content_type,
        performance_rating: result.performance_rating,
        hook_variations: result.hook_variations,
        optimized_caption: result.caption,
        cta: result.cta,
        best_time: result.best_time_to_post,
        hashtags: result.hashtags,
      },
    })
  }

  // Generate content for drafts
  for (const draft of (drafts ?? []) as ContentPiece[]) {
    const result = await runAgentJSON<ContentBrief>(
      `You are a viral content strategist for DigitalAimz.
Create content briefs that are ready to film — specific, punchy, algorithm-friendly.`,
      `Create a complete content brief for this draft:

Title: ${draft.title ?? 'Untitled'}
Platform: ${draft.platform ?? 'Instagram'}
Type: ${draft.content_type ?? 'Reel'}
Initial Hook: "${draft.hook ?? 'Not set'}"

Return JSON:
{
  "title": "<refined title>",
  "hook": "<powerful opening line>",
  "body_outline": ["<point 1>", "<point 2>", "<point 3>"],
  "cta": "<closing CTA>",
  "platform_tips": ["<tip 1>", "<tip 2>"],
  "estimated_performance": "<prediction>"
}`
    )

    decisions.push({
      title: `Approve content brief: "${result.title}"`,
      description: `Hook: "${result.hook}"\n\nOutline:\n${result.body_outline.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nCTA: ${result.cta}`,
      payload: {
        piece_id: draft.id,
        refined_title: result.title,
        hook: result.hook,
        body_outline: result.body_outline,
        cta: result.cta,
        platform_tips: result.platform_tips,
      },
    })
  }

  await supabase.from('agent_logs').insert({
    agent: 'marketing',
    action: 'analyze_content',
    details: { published_analyzed: published?.length ?? 0, drafts_processed: drafts?.length ?? 0 },
    success: true,
  })

  return { decisions, processed: (published?.length ?? 0) + (drafts?.length ?? 0) }
}

export async function generateReelHooks(topic: string, platform: string): Promise<{
  hooks: Array<{ hook: string; psychology: string; score: number }>
  caption: string
  hashtags: string[]
}> {
  return runAgentJSON(
    `You are a world-class viral content creator specializing in ${platform} content about digital marketing and SEO.`,
    `Generate 5 viral hooks for this topic: "${topic}" on ${platform}

Return JSON:
{
  "hooks": [
    {"hook": "<hook>", "psychology": "<why it works>", "score": <0-100>}
  ],
  "caption": "<full caption>",
  "hashtags": ["<tag>"]
}`
  )
}
