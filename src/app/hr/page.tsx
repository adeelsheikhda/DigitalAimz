import { createClient } from '@/lib/supabase/server'
import { DecisionCard } from '@/components/decision-card'
import { RunAgentButton } from '@/components/run-agent-button'
import { StatCard } from '@/components/stat-card'
import { AddCandidateForm } from '@/components/forms/add-candidate-form'
import { formatDate, cn } from '@/lib/utils'
import type { Decision, Candidate } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HRPage() {
  let candidates: Candidate[] = []
  let decisions: Decision[] = []

  try {
    const supabase = await createClient()
    const [candidatesRes, decisionsRes] = await Promise.all([
      supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      supabase.from('decisions').select('*').eq('agent', 'hr').eq('status', 'pending').order('priority', { ascending: false }),
    ])
    candidates = (candidatesRes.data ?? []) as Candidate[]
    decisions = (decisionsRes.data ?? []) as Decision[]
  } catch {}

  const byStatus = {
    new: candidates.filter(c => c.status === 'new').length,
    screened: candidates.filter(c => c.status === 'screened').length,
    interview_scheduled: candidates.filter(c => c.status === 'interview_scheduled').length,
    hired: candidates.filter(c => c.status === 'hired').length,
  }

  const scoreColor = (score: number | null) => {
    if (!score) return 'text-zinc-500'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🧑‍💼 HR Agent</h1>
          <p className="text-zinc-500 text-sm mt-1">Resume screening · Interview scheduling · Candidate pipeline</p>
        </div>
        <RunAgentButton agent="hr" label="HR" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="New Candidates" value={byStatus.new} icon="📥" variant={byStatus.new > 0 ? 'warning' : 'default'} />
        <StatCard label="Screened" value={byStatus.screened} icon="🔍" />
        <StatCard label="Interviews" value={byStatus.interview_scheduled} icon="📅" />
        <StatCard label="Hired" value={byStatus.hired} icon="✅" variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate List */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Candidates</h2>
          <AddCandidateForm />
          {candidates.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">No candidates yet. Add resumes to the candidates table.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {candidates.map(c => (
                <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">{c.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{c.position}</p>
                    </div>
                    <div className="text-right">
                      {c.ai_score !== null && (
                        <p className={cn('font-bold text-lg leading-none', scoreColor(c.ai_score))}>{c.ai_score}</p>
                      )}
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border mt-1 inline-block',
                        c.status === 'hired' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                        c.status === 'screened' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                        c.status === 'interview_scheduled' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                        c.status === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                        'border-zinc-700 text-zinc-400'
                      )}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {c.ai_summary && (
                    <p className="text-zinc-400 text-xs leading-relaxed mb-2">{c.ai_summary}</p>
                  )}
                  {(c.strengths?.length > 0) && (
                    <div className="flex flex-wrap gap-1">
                      {c.strengths.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  {c.email && <p className="text-zinc-600 text-xs mt-2">{c.email}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Decisions */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Pending Decisions
            {decisions.length > 0 && (
              <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-500/20">
                {decisions.length}
              </span>
            )}
          </h2>
          {decisions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">Run the HR agent to screen candidates and generate decisions.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {decisions.map(d => (
                <DecisionCard
                  key={d.id}
                  decision={d}
                  onDecide={async (id, status) => {
                    'use server'
                    const { createClient } = await import('@/lib/supabase/server')
                    const supabase = await createClient()
                    await supabase.from('decisions').update({ status, decided_at: new Date().toISOString() }).eq('id', id)
                    if (status === 'approved') {
                      const { data: dec } = await supabase.from('decisions').select('payload').eq('id', id).single()
                      if (dec?.payload?.candidate_id) {
                        await supabase.from('candidates').update({ status: 'interview_scheduled' }).eq('id', dec.payload.candidate_id)
                      }
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
