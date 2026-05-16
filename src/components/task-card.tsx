'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, agentColor, agentIcon } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string | null
  department: string
  priority: string
  status: string
  due_date: string | null
  ai_assigned: boolean
  created_at: string
}

interface TaskCardProps {
  task: Task
  onUpdate?: () => void
}

const priorityStyle: Record<string, string> = {
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
}

const statusStyle: Record<string, string> = {
  todo: 'border-zinc-700 text-zinc-400',
  in_progress: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  done: 'border-green-500/30 text-green-400 bg-green-500/10',
  cancelled: 'border-zinc-800 text-zinc-600',
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState(task.status)
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: string) {
    setLoading(true)
    await fetch('/api/data/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    })
    setStatus(newStatus)
    setLoading(false)
    onUpdate ? onUpdate() : router.refresh()
  }

  if (status === 'done' || status === 'cancelled') {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-3 opacity-50">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span>{status === 'done' ? '✅' : '✗'}</span>
          <span className="line-through">{task.title}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-sm font-medium leading-snug">{task.title}</p>
        <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', priorityStyle[task.priority] ?? priorityStyle.medium)}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-zinc-500 text-xs leading-relaxed mb-3">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={cn('text-xs px-2 py-0.5 rounded-full border', agentColor(task.department))}>
          {agentIcon(task.department)} {task.department === 'unassigned' ? 'Unassigned' : task.department.toUpperCase()}
        </span>
        {task.ai_assigned && (
          <span className="text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full">
            🤖 CEO assigned
          </span>
        )}
        {task.due_date && (
          <span className="text-zinc-600 text-xs">
            Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => updateStatus('in_progress')}
          disabled={loading || status === 'in_progress'}
          className={cn(
            'flex-1 py-1.5 text-xs rounded-lg border transition-all',
            status === 'in_progress'
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 cursor-default'
              : 'border-zinc-700 text-zinc-500 hover:text-blue-400 hover:border-blue-500/30'
          )}
        >
          {status === 'in_progress' ? '⟳ In Progress' : '▶ Start'}
        </button>
        <button
          onClick={() => updateStatus('done')}
          disabled={loading}
          className="flex-1 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-500 hover:text-green-400 hover:border-green-500/30 transition-all"
        >
          ✓ Done
        </button>
        <button
          onClick={() => updateStatus('cancelled')}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-600 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
