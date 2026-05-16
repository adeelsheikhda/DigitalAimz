'use client'

import { useState } from 'react'
import { cn, agentColor } from '@/lib/utils'

interface RunAgentButtonProps {
  agent: string
  label?: string
  onComplete?: () => void
}

export function RunAgentButton({ agent, label, onComplete }: RunAgentButtonProps) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    setState('running')
    setResult(null)
    try {
      const res = await fetch(`/api/agents/${agent}`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        const d = data.data
        const msg = d.decisions_created !== undefined
          ? `${d.processed ?? 0} processed • ${d.decisions_created} decisions created`
          : 'Done'
        setResult(msg)
        setState('done')
        onComplete?.()
      } else {
        setResult(data.error ?? 'Error')
        setState('error')
      }
    } catch {
      setResult('Network error')
      setState('error')
    }

    setTimeout(() => {
      setState('idle')
      setResult(null)
    }, 4000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={run}
        disabled={state === 'running'}
        className={cn(
          'text-xs px-3 py-1.5 rounded-lg border transition-all font-medium',
          state === 'running' ? 'opacity-50 cursor-not-allowed border-zinc-700 text-zinc-500' :
          state === 'done' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
          state === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
          'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
        )}
      >
        {state === 'running' ? (
          <span className="flex items-center gap-1.5">
            <span className="animate-spin">⟳</span> Running…
          </span>
        ) : state === 'done' ? '✓ Done' : state === 'error' ? '✗ Failed' : `▶ Run ${label ?? agent} agent`}
      </button>
      {result && <span className="text-zinc-500 text-xs">{result}</span>}
    </div>
  )
}
