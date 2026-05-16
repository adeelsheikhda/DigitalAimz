'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddTaskFormProps {
  onSuccess?: () => void
}

export function AddTaskForm({ onSuccess }: AddTaskFormProps = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', department: 'unassigned', priority: 'medium', due_date: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/data/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      let data: { success: boolean; error?: string } = { success: false }
      try { data = await res.json() } catch { data = { success: false, error: `Server error (${res.status})` } }
      setLoading(false)
      if (data.success) {
        setForm({ title: '', description: '', department: 'unassigned', priority: 'medium', due_date: '' })
        setOpen(false)
        onSuccess ? onSuccess() : router.refresh()
      } else {
        const msg = data.error ?? 'Something went wrong'
        if (msg.includes('does not exist')) {
          setError('Tasks table missing — run the SQL migration in Supabase (see setup guide).')
        } else if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
          setError('Cannot reach Supabase — check your .env.local credentials or wake up the Supabase project.')
        } else {
          setError(msg)
        }
      }
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Network error — is the dev server running?')
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
      >
        <span className="flex items-center gap-2 font-medium">
          <span className="text-purple-400">＋</span> Add New Task
        </span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-zinc-800 p-4 space-y-3">
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Task Title *</label>
            <input
              required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Follow up with Dubai client about SEO proposal"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Description</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Any extra context — the CEO agent uses this to assign it correctly if you leave department as Auto"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Department</label>
              <select
                value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="unassigned">🤖 Auto (CEO assigns)</option>
                <option value="hr">🧑‍💼 HR</option>
                <option value="sales">💰 Sales</option>
                <option value="finance">📊 Finance</option>
                <option value="marketing">📱 Marketing</option>
                <option value="seo">🔍 SEO</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Priority</label>
              <select
                value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Due Date</label>
              <input
                type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
