import { createClient } from '@/lib/supabase/server'
import { DecisionCard } from '@/components/decision-card'
import { BriefingCard } from '@/components/briefing-card'
import { RunAgentButton } from '@/components/run-agent-button'
import { StatCard } from '@/components/stat-card'
import { formatCurrency } from '@/lib/utils'
import type { Decision, Briefing } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let briefing = null
  let decisions: Decision[] = []
  let pipelineValue = 0
  let overdueAmount = 0
  let pendingCount = 0
  let activeLeads = 0
  let activeCandidates = 0

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      briefingRes,
      decisionsRes,
      leadsRes,
      invoicesRes,
      candidatesRes,
    ] = await Promise.all([
      supabase.from('briefings').select('*').eq('briefing_date', today).single(),
      supabase.from('decisions').select('*').eq('status', 'pending').order('priority', { ascending: false }).limit(20),
      supabase.from('leads').select('value,stage').not('stage', 'in', '("won","lost")'),
      supabase.from('invoices').select('amount,status').not('status', 'eq', 'paid'),
      supabase.from('candidates').select('status').not('status', 'in', '("rejected","hired")'),
    ])

    briefing = briefingRes.data
    decisions = (decisionsRes.data ?? []) as Decision[]
    pipelineValue = (leadsRes.data ?? []).reduce((s, l) => s + Number(l.value ?? 0), 0)
    overdueAmount = (invoicesRes.data ?? []).filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0)
    pendingCount = decisions.length
    activeLeads = (leadsRes.data ?? []).length
    activeCandidates = (candidatesRes.data ?? []).length
  } catch {}

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning 👑</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <RunAgentButton agent="ceo" label="CEO" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon="💰" />
        <StatCard
          label="Overdue Invoices"
          value={formatCurrency(overdueAmount)}
          icon="🔴"
          variant={overdueAmount > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Pending Decisions"
          value={pendingCount}
          sub="awaiting your call"
          icon="⚡"
          variant={pendingCount > 5 ? 'warning' : 'default'}
        />
        <StatCard label="Active Leads" value={activeLeads} sub={`${activeCandidates} candidates`} icon="📋" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {briefing ? (
            <BriefingCard briefing={briefing as Briefing} />
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-3xl mb-3">👑</p>
              <p className="text-zinc-400 text-sm mb-4">No briefing generated yet for today.</p>
              <RunAgentButton agent="ceo" label="Generate Morning Briefing" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
              Decision Queue
              {pendingCount > 0 && (
                <span className="ml-2 bg-purple-500/20 text-purple-400 text-xs font-medium px-2 py-0.5 rounded-full border border-purple-500/20">
                  {pendingCount}
                </span>
              )}
            </h2>
          </div>

          {decisions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-zinc-500 text-sm">All caught up. Run an agent to generate new decisions.</p>
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
                    await supabase
                      .from('decisions')
                      .update({ status, decided_at: new Date().toISOString() })
                      .eq('id', id)
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
