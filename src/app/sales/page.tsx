import { createClient } from '@/lib/supabase/server'
import { DecisionCard } from '@/components/decision-card'
import { RunAgentButton } from '@/components/run-agent-button'
import { StatCard } from '@/components/stat-card'
import { formatCurrency, formatRelative, cn } from '@/lib/utils'
import type { Decision, Lead } from '@/types'

export const dynamic = 'force-dynamic'

const stageOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export default async function SalesPage() {
  let leads: Lead[] = []
  let decisions: Decision[] = []

  try {
    const supabase = await createClient()
    const [leadsRes, decisionsRes] = await Promise.all([
      supabase.from('leads').select('*').order('ai_priority_score', { ascending: false }),
      supabase.from('decisions').select('*').eq('agent', 'sales').eq('status', 'pending').order('priority', { ascending: false }),
    ])
    leads = (leadsRes.data ?? []) as Lead[]
    decisions = (decisionsRes.data ?? []) as Decision[]
  } catch {}

  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.stage))
  const pipelineValue = activeLeads.reduce((s, l) => s + Number(l.value ?? 0), 0)
  const wonValue = leads.filter(l => l.stage === 'won').reduce((s, l) => s + Number(l.value ?? 0), 0)
  const hotLeads = activeLeads.filter(l => (l.ai_priority_score ?? 0) >= 70).length

  const priorityColor = (score: number | null) => {
    if (!score) return 'text-zinc-500'
    if (score >= 80) return 'text-red-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-zinc-400'
  }

  const stageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: 'border-zinc-700 text-zinc-400',
      contacted: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      qualified: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      proposal: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
      negotiation: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
      won: 'border-green-500/30 text-green-400 bg-green-500/10',
      lost: 'border-red-500/30 text-red-400 bg-red-500/10',
    }
    return colors[stage] ?? 'border-zinc-700 text-zinc-400'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 Sales Agent</h1>
          <p className="text-zinc-500 text-sm mt-1">Lead tracking · Follow-up drafts · Pipeline management</p>
        </div>
        <RunAgentButton agent="sales" label="Sales" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon="💰" />
        <StatCard label="Won (Total)" value={formatCurrency(wonValue)} icon="🏆" variant="success" />
        <StatCard label="Active Leads" value={activeLeads.length} icon="📋" />
        <StatCard label="Hot Leads" value={hotLeads} sub="score ≥ 70" icon="🔥" variant={hotLeads > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead List */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">All Leads</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {leads.map(lead => (
              <div key={lead.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{lead.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{lead.company ?? 'No company'} · {lead.source ?? 'Unknown source'}</p>
                  </div>
                  <div className="text-right">
                    {lead.ai_priority_score !== null && (
                      <p className={cn('font-bold text-lg leading-none', priorityColor(lead.ai_priority_score))}>
                        {lead.ai_priority_score}
                      </p>
                    )}
                    {lead.value && (
                      <p className="text-zinc-400 text-xs mt-0.5">{formatCurrency(Number(lead.value))}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', stageColor(lead.stage))}>
                    {lead.stage}
                  </span>
                  {lead.last_contact && (
                    <span className="text-zinc-600 text-xs">{formatRelative(lead.last_contact)}</span>
                  )}
                </div>
                {lead.notes && (
                  <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{lead.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Decisions */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Follow-up Queue
            {decisions.length > 0 && (
              <span className="ml-2 bg-green-500/20 text-green-400 text-xs font-medium px-2 py-0.5 rounded-full border border-green-500/20">
                {decisions.length}
              </span>
            )}
          </h2>
          {decisions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">Run the Sales agent to analyze leads and draft follow-ups.</p>
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
                      if (dec?.payload?.lead_id && dec?.payload?.next_stage) {
                        await supabase.from('leads').update({
                          stage: dec.payload.next_stage,
                          last_contact: new Date().toISOString(),
                        }).eq('id', dec.payload.lead_id)
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
