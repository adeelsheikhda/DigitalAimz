import { createClient } from '@/lib/supabase/server'
import { DecisionCard } from '@/components/decision-card'
import { RunAgentButton } from '@/components/run-agent-button'
import { StatCard } from '@/components/stat-card'
import { AddContentForm } from '@/components/forms/add-content-form'
import { cn } from '@/lib/utils'
import type { Decision, ContentPiece } from '@/types'

export const dynamic = 'force-dynamic'

export default async function MarketingPage() {
  let content: ContentPiece[] = []
  let decisions: Decision[] = []

  try {
    const supabase = await createClient()
    const [contentRes, decisionsRes] = await Promise.all([
      supabase.from('content_pieces').select('*').order('created_at', { ascending: false }),
      supabase.from('decisions').select('*').eq('agent', 'marketing').eq('status', 'pending').order('priority', { ascending: false }),
    ])
    content = (contentRes.data ?? []) as ContentPiece[]
    decisions = (decisionsRes.data ?? []) as Decision[]
  } catch {}

  const published = content.filter(c => c.status === 'published')
  const drafts = content.filter(c => c.status === 'draft')
  const totalViews = published.reduce((s, c) => s + (c.performance?.views ?? 0), 0)
  const totalSaves = published.reduce((s, c) => s + (c.performance?.saves ?? 0), 0)

  const platformIcon = (p: string | null) => {
    const icons: Record<string, string> = { instagram: '📸', tiktok: '🎵', youtube: '▶️', linkedin: '💼', twitter: '🐦' }
    return icons[p ?? ''] ?? '📱'
  }

  const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
      published: 'border-green-500/30 text-green-400 bg-green-500/10',
      approved: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      draft: 'border-zinc-700 text-zinc-400',
      archived: 'border-zinc-800 text-zinc-600',
    }
    return styles[status] ?? 'border-zinc-700 text-zinc-400'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📱 Marketing Agent</h1>
          <p className="text-zinc-500 text-sm mt-1">Content analysis · Hook writing · Reel optimization</p>
        </div>
        <RunAgentButton agent="marketing" label="Marketing" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon="👁️" />
        <StatCard label="Total Saves" value={totalSaves.toLocaleString()} icon="🔖" />
        <StatCard label="Published" value={published.length} icon="✅" variant="success" />
        <StatCard label="Drafts" value={drafts.length} icon="✍️" variant={drafts.length > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content List */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Content Pieces</h2>
          <AddContentForm />
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {content.map(piece => (
              <div key={piece.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{platformIcon(piece.platform)}</span>
                      <p className="text-white font-medium text-sm truncate">{piece.title ?? 'Untitled'}</p>
                    </div>
                    {piece.hook && (
                      <p className="text-zinc-400 text-xs leading-relaxed italic">"{piece.hook}"</p>
                    )}
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', statusStyle(piece.status))}>
                    {piece.status}
                  </span>
                </div>
                {piece.status === 'published' && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[
                      { label: 'views', value: (piece.performance?.views ?? 0).toLocaleString() },
                      { label: 'likes', value: (piece.performance?.likes ?? 0).toLocaleString() },
                      { label: 'shares', value: (piece.performance?.shares ?? 0).toLocaleString() },
                      { label: 'saves', value: (piece.performance?.saves ?? 0).toLocaleString() },
                    ].map(stat => (
                      <div key={stat.label} className="text-center">
                        <p className="text-white font-semibold text-sm">{stat.value}</p>
                        <p className="text-zinc-600 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {piece.ai_hook_suggestions && piece.ai_hook_suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-zinc-600 text-xs font-medium">AI Hooks:</p>
                    {piece.ai_hook_suggestions.slice(0, 2).map((h, i) => (
                      <p key={i} className="text-zinc-500 text-xs leading-relaxed">• {h}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Decisions */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Content Decisions
            {decisions.length > 0 && (
              <span className="ml-2 bg-pink-500/20 text-pink-400 text-xs font-medium px-2 py-0.5 rounded-full border border-pink-500/20">
                {decisions.length}
              </span>
            )}
          </h2>
          {decisions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">Run the Marketing agent to analyze reels and generate hooks.</p>
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
                      if (dec?.payload?.piece_id) {
                        const updates: Record<string, unknown> = { status: 'approved' }
                        if (dec.payload.hook) updates.hook = dec.payload.hook
                        if (dec.payload.optimized_caption) updates.body = dec.payload.optimized_caption
                        await supabase.from('content_pieces').update(updates).eq('id', dec.payload.piece_id)
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
