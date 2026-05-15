import { runAgentJSON } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { Candidate } from '@/types'

interface HRScreenResult {
  score: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'pass'
  interview_suggested: boolean
}

export async function screenCandidates(): Promise<{
  decisions: Array<{ title: string; description: string; payload: Record<string, unknown> }>
  processed: number
}> {
  const supabase = await createClient()

  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('status', 'new')
    .limit(10)

  if (error || !candidates?.length) return { decisions: [], processed: 0 }

  const decisions = []

  for (const candidate of candidates as Candidate[]) {
    if (!candidate.resume_text) continue

    const result = await runAgentJSON<HRScreenResult>(
      `You are an elite HR screening agent for DigitalAimz, a digital marketing and SEO agency.
You evaluate candidates with the precision of a top-tier recruiter.
Score based on: relevant experience, skills match, growth trajectory, communication clarity.
Be decisive. Time is money.`,
      `Screen this candidate for the role: ${candidate.position}

RESUME:
${candidate.resume_text}

Return JSON:
{
  "score": <0-100 integer>,
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendation": "<strong_hire|hire|maybe|pass>",
  "interview_suggested": <true|false>
}`
    )

    await supabase
      .from('candidates')
      .update({
        ai_score: result.score,
        ai_summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        status: 'screened',
      })
      .eq('id', candidate.id)

    if (result.interview_suggested) {
      decisions.push({
        title: `Schedule interview: ${candidate.name} (${result.score}/100)`,
        description: `${result.recommendation.replace('_', ' ').toUpperCase()} — ${result.summary}\n\nStrengths: ${result.strengths.join(', ')}\nWeaknesses: ${result.weaknesses.join(', ')}`,
        payload: {
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          candidate_email: candidate.email,
          position: candidate.position,
          score: result.score,
          recommendation: result.recommendation,
        },
      })
    }
  }

  await supabase.from('agent_logs').insert({
    agent: 'hr',
    action: 'screen_candidates',
    details: { processed: candidates.length, decisions_created: decisions.length },
    success: true,
  })

  return { decisions, processed: candidates.length }
}

export async function generateInterviewEmail(
  candidateId: string
): Promise<string> {
  const supabase = await createClient()
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (!candidate) throw new Error('Candidate not found')

  return runAgentJSON<{ email: string }>(
    `You are the HR manager for DigitalAimz, a fast-growing digital marketing agency.
Write professional, warm, and specific interview invitation emails.`,
    `Write an interview invitation email for:
Name: ${candidate.name}
Position: ${candidate.position}
Their score: ${candidate.ai_score}/100
Summary: ${candidate.ai_summary}

Return JSON: { "email": "<full email body>" }`
  ).then(r => r.email)
}
