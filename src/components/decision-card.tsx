'use client'

import { useState } from 'react'
import { cn, agentColor, agentIcon, formatRelative } from '@/lib/utils'
import type { Decision } from '@/types'

interface DecisionCardProps {
  decision: Decision
  onDecide: (id: string, status: 'approved' | 'skipped') => Promise<void>
}

export function DecisionCard({ decision, onDecide }: DecisionCardProps) {
  const [loading, setLoading] = useState<'approved' | 'skipped' | null>(null)
  const [decided, setDecided] = useState<'approved' | 'skipped' | null>(null)
  const [expanded, setExpanded] = useState(false)

  const payload = decision.payload as Record<string, unknown>
  const emailDraft = payload.email_draft as string | undefined
  const subject = (payload.subject ?? payload.follow_up_subject) as string | undefined

  async function handle(status: 'approved' | 'skipped') {
    setLoading(status)
    await onDecide(decision.id, status)
    setDecided(status)
    setLoading(null)
  }

  if (decided) {
    return (
      <div className={cn(
        'rounded-xl border p-4 opacity-50 transition-all',
        decided === 'approved' ? 'border-green-500/20 bg-green-500/5' : 'border-zinc-700/50 bg-zinc-900/30'
      )}>
        <div className="flex items-center gap-2 text-sm">
          <span>{decided === 'approved' ? '✅' : '⏭️'}</span>
          <span className="text-zinc-400">{decided === 'approved' ? 'Approved' : 'Skipped'}: {decision.title}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-all hover:border-zinc-700">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide',
              agentColor(decision.agent)
            )}>
              {agentIcon(decision.agent)} {decision.agent}
            </span>
            {decision.priority >= 80 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                URGENT
              </span>
            )}
          </div>
          <span className="text-zinc-600 text-xs shrink-0">{formatRelative(decision.created_at)}</span>
        </div>

        <h3 className="text-white font-medium text-sm mb-2 leading-snug">{decision.title}</h3>
        <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
          {expanded ? decision.description : decision.description.slice(0, 180) + (decision.description.length > 180 ? '…' : '')}
        </p>

        {decision.description.length > 180 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-500 text-xs mt-1 hover:text-zinc-300 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {expanded && emailDraft && (
          <div className="mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            {subject && <p className="text-zinc-300 text-xs font-medium mb-1">Subject: {subject}</p>}
            <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line font-mono">{emailDraft}</p>
          </div>
        )}
      </div>

      <div className="flex border-t border-zinc-800">
        <button
          onClick={() => handle('skipped')}
          disabled={!!loading}
          className="flex-1 py-3 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50 border-r border-zinc-800"
        >
          {loading === 'skipped' ? '…' : '⏭ Skip'}
        </button>
        <button
          onClick={() => handle('approved')}
          disabled={!!loading}
          className="flex-1 py-3 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/5 transition-all disabled:opacity-50 font-medium"
        >
          {loading === 'approved' ? '…' : '✓ Approve'}
        </button>
      </div>
    </div>
  )
}
