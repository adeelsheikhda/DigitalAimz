import { createClient } from '@/lib/supabase/server'
import { DecisionCard } from '@/components/decision-card'
import { RunAgentButton } from '@/components/run-agent-button'
import { StatCard } from '@/components/stat-card'
import { AddSeoForm } from '@/components/forms/add-seo-form'
import { cn } from '@/lib/utils'
import type { Decision, SeoContent } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SeoPage() {
  let seoItems: SeoContent[] = []
  let decisions: Decision[] = []

  try {
    const supabase = await createClient()
    const [seoRes, decisionsRes] = await Promise.all([
      supabase.from('seo_content').select('*').order('created_at', { ascending: false }),
      supabase.from('decisions').select('*').eq('agent', 'seo').eq('status', 'pending').order('priority', { ascending: false }),
    ])
    seoItems = (seoRes.data ?? []) as SeoContent[]
    decisions = (decisionsRes.data ?? []) as Decision[]
  } catch {}

  const researching = seoItems.filter(s => s.status === 'researching').length
  const drafted = seoItems.filter(s => s.status === 'drafted').length
  const approved = seoItems.filter(s => s.status === 'approved').length
  const published = seoItems.filter(s => s.status === 'published').length

  const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
      researching: 'border-zinc-700 text-zinc-400',
      briefed: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      drafted: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      approved: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
      published: 'border-green-500/30 text-green-400 bg-green-500/10',
    }
    return styles[status] ?? 'border-zinc-700 text-zinc-400'
  }

  const intentColor = (intent: string | null) => {
    const colors: Record<string, string> = {
      informational: 'text-blue-400',
      commercial: 'text-purple-400',
      transactional: 'text-green-400',
      navigational: 'text-zinc-400',
    }
    return colors[intent ?? ''] ?? 'text-zinc-500'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🔍 SEO Agent</h1>
          <p className="text-zinc-500 text-sm mt-1">Competitor analysis · Content briefs · Rank above top 10 with 0 backlinks</p>
        </div>
        <RunAgentButton agent="seo" label="SEO" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Researching" value={researching} icon="🔬" variant={researching > 0 ? 'warning' : 'default'} />
        <StatCard label="Drafted" value={drafted} icon="✍️" />
        <StatCard label="Approved" value={approved} icon="✅" />
        <StatCard label="Published" value={published} icon="🚀" variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Content List */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Keyword Pipeline</h2>
          <AddSeoForm />
          {seoItems.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">Add keywords to seo_content table to begin research.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {seoItems.map(item => (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-white font-medium text-sm">{item.keyword}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.search_volume && (
                          <span className="text-zinc-500 text-xs">{item.search_volume.toLocaleString()} vol</span>
                        )}
                        {item.keyword_difficulty && (
                          <span className={cn('text-xs', item.keyword_difficulty > 60 ? 'text-red-400' : item.keyword_difficulty > 40 ? 'text-yellow-400' : 'text-green-400')}>
                            KD {item.keyword_difficulty}
                          </span>
                        )}
                        {item.search_intent && (
                          <span className={cn('text-xs', intentColor(item.search_intent))}>{item.search_intent}</span>
                        )}
                      </div>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', statusStyle(item.status))}>
                      {item.status}
                    </span>
                  </div>

                  {item.content_brief && (() => {
                    try {
                      const brief = JSON.parse(item.content_brief)
                      return (
                        <div className="mt-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                          <p className="text-zinc-300 text-xs font-medium">{brief.title}</p>
                          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{brief.content_angle}</p>
                        </div>
                      )
                    } catch { return null }
                  })()}

                  {item.word_count && (
                    <p className="text-zinc-600 text-xs mt-2">{item.word_count.toLocaleString()} words drafted</p>
                  )}

                  {/* Per-item actions */}
                  {item.status === 'researching' && (
                    <form action={async () => {
                      'use server'
                      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/agents/seo`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'research', keyword_id: item.id }),
                      })
                    }} className="mt-2">
                      <button type="submit" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        ▶ Research this keyword →
                      </button>
                    </form>
                  )}
                  {item.status === 'briefed' && (
                    <form action={async () => {
                      'use server'
                      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/agents/seo`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'draft', keyword_id: item.id }),
                      })
                    }} className="mt-2">
                      <button type="submit" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                        ✍️ Draft full article →
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Decisions */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Content Approvals
            {decisions.length > 0 && (
              <span className="ml-2 bg-cyan-500/20 text-cyan-400 text-xs font-medium px-2 py-0.5 rounded-full border border-cyan-500/20">
                {decisions.length}
              </span>
            )}
          </h2>
          {decisions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">Run the SEO agent to research keywords and generate content briefs for approval.</p>
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
                      if (dec?.payload?.seo_id) {
                        await supabase.from('seo_content').update({ status: 'approved' }).eq('id', dec.payload.seo_id)
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
