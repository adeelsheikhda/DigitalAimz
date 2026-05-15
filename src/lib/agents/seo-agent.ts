import { runAgentJSON, runAgent } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { SeoContent, CompetitorAnalysis } from '@/types'

interface CompetitorIntel {
  url: string
  estimated_word_count: number
  likely_h2s: string[]
  key_topics: string[]
  content_gaps: string[]
  weakness: string
  score: number
}

interface ContentBrief {
  title: string
  meta_description: string
  primary_keyword: string
  secondary_keywords: string[]
  search_intent: string
  content_angle: string
  outline: Array<{ heading: string; points: string[]; estimated_words: number }>
  total_estimated_words: number
  why_this_beats_competitors: string
  internal_links: string[]
  faq_section: Array<{ question: string; answer: string }>
}

export async function researchKeyword(keywordId: string): Promise<{
  brief: ContentBrief
  competitor_analysis: CompetitorIntel[]
}> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('seo_content')
    .select('*')
    .eq('id', keywordId)
    .single()

  if (!item) throw new Error('Keyword not found')

  const keyword = item.keyword

  // Step 1: Analyze what top competitors would likely have
  const competitorAnalysis = await runAgentJSON<CompetitorIntel[]>(
    `You are an elite SEO strategist. You understand search intent at a deep level.
You know what the top 10 Google results for any keyword look like.
Your job is to identify exactly what content exists and more importantly, what's MISSING.`,
    `For the keyword: "${keyword}"

Based on your knowledge of what typically ranks on Google for this type of keyword, analyze what the top 10 competitor pages likely contain, and identify the gaps.

Return JSON array of 5 competitor page archetypes:
[
  {
    "url": "<example URL pattern that would rank>",
    "estimated_word_count": <number>,
    "likely_h2s": ["<h2 1>", "<h2 2>", "<h2 3>"],
    "key_topics": ["<topic 1>", "<topic 2>"],
    "content_gaps": ["<what they miss 1>", "<what they miss 2>"],
    "weakness": "<their biggest content weakness>",
    "score": <1-10 content quality>
  }
]`
  )

  // Step 2: Generate the content brief
  const gapsSummary = competitorAnalysis
    .flatMap(c => c.content_gaps)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join('; ')

  const weaknesses = competitorAnalysis
    .map(c => c.weakness)
    .join('; ')

  const brief = await runAgentJSON<ContentBrief>(
    `You are the world's best SEO content strategist.
You create content that dominates search by being 10x better than competitors — more comprehensive, more specific, more useful, and perfectly aligned with search intent.
You write for humans first, search engines second.
You understand that in 2026, ranking without backlinks requires: perfect intent match, topical authority, and content so good it gets cited naturally.`,
    `Create a complete content brief to rank #1 for: "${keyword}"

Search Volume: ${item.search_volume ?? 'Unknown'}
Keyword Difficulty: ${item.keyword_difficulty ?? 'Unknown'}
Search Intent: ${item.search_intent ?? 'Unknown'}

Competitor Weaknesses: ${weaknesses}
Content Gaps to Exploit: ${gapsSummary}

Return JSON:
{
  "title": "<SEO-optimized title that also compels clicks>",
  "meta_description": "<155 char meta description>",
  "primary_keyword": "${keyword}",
  "secondary_keywords": ["<kw 1>", "<kw 2>", "<kw 3>", "<kw 4>", "<kw 5>"],
  "search_intent": "<exact intent>",
  "content_angle": "<unique angle that differentiates from competitors>",
  "outline": [
    {
      "heading": "<H2>",
      "points": ["<point 1>", "<point 2>", "<point 3>"],
      "estimated_words": <number>
    }
  ],
  "total_estimated_words": <number>,
  "why_this_beats_competitors": "<2-3 sentences>",
  "internal_links": ["<suggested internal page 1>", "<suggested internal page 2>"],
  "faq_section": [
    {"question": "<PAA-style question>", "answer": "<concise direct answer>"}
  ]
}`
  )

  // Step 3: Store everything
  const formattedCompetitors: CompetitorAnalysis[] = competitorAnalysis.map(c => ({
    url: c.url,
    title: c.url,
    word_count: c.estimated_word_count,
    key_topics: c.key_topics,
    content_gaps: c.content_gaps,
    score: c.score,
  }))

  await supabase
    .from('seo_content')
    .update({
      competitor_analysis: formattedCompetitors,
      content_brief: JSON.stringify(brief, null, 2),
      search_intent: brief.search_intent as SeoContent['search_intent'],
      status: 'briefed',
    })
    .eq('id', keywordId)

  await supabase.from('agent_logs').insert({
    agent: 'seo',
    action: 'research_keyword',
    details: { keyword, competitors_analyzed: competitorAnalysis.length },
    success: true,
  })

  return { brief, competitor_analysis: competitorAnalysis }
}

export async function draftContent(keywordId: string): Promise<string> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('seo_content')
    .select('*')
    .eq('id', keywordId)
    .single()

  if (!item || !item.content_brief) throw new Error('No brief found. Run research first.')

  const brief = JSON.parse(item.content_brief) as ContentBrief

  const content = await runAgent(
    `You are an elite SEO content writer who creates content that ranks #1 without backlinks.
Your content is:
- Perfectly matched to search intent
- Written for humans, structured for SEO
- Comprehensive but not padded
- Specific with real examples and data
- Formatted with clear H2/H3 hierarchy
- Engaging enough to earn natural shares and links
Always write in markdown format.`,
    `Write the complete article for this brief:

Title: ${brief.title}
Primary Keyword: ${brief.primary_keyword}
Secondary Keywords: ${brief.secondary_keywords.join(', ')}
Content Angle: ${brief.content_angle}
Target Words: ${brief.total_estimated_words}

OUTLINE:
${brief.outline.map(s => `## ${s.heading}\n${s.points.map(p => `- ${p}`).join('\n')}`).join('\n\n')}

FAQ QUESTIONS TO INCLUDE:
${brief.faq_section.map(f => `Q: ${f.question}`).join('\n')}

Write the complete, publish-ready article now. Include all sections, FAQ, and a strong intro paragraph. Format in markdown.`,
    8192
  )

  const wordCount = content.split(/\s+/).length

  await supabase
    .from('seo_content')
    .update({
      draft_content: content,
      word_count: wordCount,
      status: 'drafted',
    })
    .eq('id', keywordId)

  return content
}

export async function runSeoQueue(): Promise<{
  decisions: Array<{ title: string; description: string; payload: Record<string, unknown> }>
  processed: number
}> {
  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('seo_content')
    .select('*')
    .eq('status', 'researching')
    .limit(3)

  if (!queue?.length) return { decisions: [], processed: 0 }

  const decisions = []

  for (const item of queue as SeoContent[]) {
    const { brief } = await researchKeyword(item.id)

    decisions.push({
      title: `SEO brief ready: "${brief.title}"`,
      description: `Keyword: ${item.keyword}\nAngle: ${brief.content_angle}\nTarget words: ${brief.total_estimated_words}\n\nWhy this beats competitors: ${brief.why_this_beats_competitors}`,
      payload: {
        seo_id: item.id,
        keyword: item.keyword,
        brief_title: brief.title,
        meta_description: brief.meta_description,
        content_angle: brief.content_angle,
        word_count: brief.total_estimated_words,
        outline: brief.outline,
      },
    })
  }

  return { decisions, processed: queue.length }
}
