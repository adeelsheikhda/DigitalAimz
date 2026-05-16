'use client'

import { useState, useEffect, useCallback } from 'react'
import { AddTaskForm } from '@/components/forms/add-task-form'
import { TaskCard } from '@/components/task-card'

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [assignResult, setAssignResult] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/data/tasks')
    const data = await res.json()
    if (data.success) setTasks(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function runCeoAssign() {
    setAssigning(true)
    setAssignResult(null)
    const res = await fetch('/api/tasks/assign', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      const n = data.data?.assigned ?? 0
      setAssignResult(n === 0 ? 'No unassigned tasks to process.' : `CEO assigned ${n} task${n !== 1 ? 's' : ''} to departments.`)
      await fetchTasks()
    } else {
      setAssignResult('Error: ' + (data.error ?? 'Unknown error'))
    }
    setAssigning(false)
  }

  const filtered = tasks.filter(t => {
    if (filter === 'all') return t.status !== 'done' && t.status !== 'cancelled'
    return t.status === filter
  })

  const unassigned = tasks.filter(t => t.department === 'unassigned' && t.status === 'todo').length

  const grouped = {
    todo: filtered.filter(t => t.status === 'todo'),
    in_progress: filtered.filter(t => t.status === 'in_progress'),
  }

  const done = tasks.filter(t => t.status === 'done' || t.status === 'cancelled')

  const stats = {
    total: tasks.filter(t => t.status !== 'cancelled').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    unassigned,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📋 Tasks</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Add tasks manually · Assign to departments · Let the CEO agent auto-assign
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={runCeoAssign}
            disabled={assigning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all disabled:opacity-60"
          >
            {assigning ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                CEO thinking…
              </>
            ) : (
              <>👑 Run CEO Auto-Assign</>
            )}
          </button>
          {unassigned > 0 && !assigning && (
            <p className="text-yellow-400 text-xs">{unassigned} unassigned task{unassigned !== 1 ? 's' : ''} waiting</p>
          )}
          {assignResult && (
            <p className={`text-xs ${assignResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {assignResult}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: '📋', color: 'text-white' },
          { label: 'To Do', value: stats.todo, icon: '⭕', color: 'text-zinc-400' },
          { label: 'In Progress', value: stats.in_progress, icon: '🔵', color: 'text-blue-400' },
          { label: 'Done', value: stats.done, icon: '✅', color: 'text-green-400' },
          { label: 'Unassigned', value: stats.unassigned, icon: '🤖', color: stats.unassigned > 0 ? 'text-yellow-400' : 'text-zinc-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              <span className="text-zinc-500 text-xs">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Task */}
      <div>
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-3">Add Task</h2>
        <AddTaskForm onSuccess={fetchTasks} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'todo', 'in_progress'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filter === f
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
          >
            {f === 'all' ? 'Active' : f === 'todo' ? 'To Do' : 'In Progress'}
          </button>
        ))}
        <button
          onClick={() => setFilter('done')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            filter === 'done'
              ? 'bg-zinc-800 text-white border-zinc-700'
              : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-sm">Loading tasks…</div>
      ) : filter === 'done' ? (
        <div className="space-y-3">
          <h2 className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">Completed / Cancelled</h2>
          {done.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">No completed tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {done.map(t => <TaskCard key={t.id} task={t} onUpdate={fetchTasks} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* To Do */}
          <div className="space-y-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
              ⭕ To Do
              <span className="text-zinc-600 font-normal normal-case tracking-normal text-xs">({grouped.todo.length})</span>
            </h2>
            {grouped.todo.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <p className="text-zinc-500 text-sm">All clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.todo.map(t => <TaskCard key={t.id} task={t} onUpdate={fetchTasks} />)}
              </div>
            )}
          </div>

          {/* In Progress */}
          <div className="space-y-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
              🔵 In Progress
              <span className="text-zinc-600 font-normal normal-case tracking-normal text-xs">({grouped.in_progress.length})</span>
            </h2>
            {grouped.in_progress.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <p className="text-zinc-500 text-sm">No tasks in progress.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.in_progress.map(t => <TaskCard key={t.id} task={t} onUpdate={fetchTasks} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
