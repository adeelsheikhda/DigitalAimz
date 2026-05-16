'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddLeadForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', source: '', stage: 'new', value: '', notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/data/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      setForm({ name: '', company: '', email: '', phone: '', source: '', stage: 'new', value: '', notes: '' })
      setOpen(false)
      router.refresh()
    } else {
      setError(data.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
      >
        <span className="flex items-center gap-2 font-medium">
          <span className="text-green-400">＋</span> Add New Lead
        </span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Full Name *</label>
              <input
                required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="James Harrington"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Company</label>
              <input
                value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="GrowthLab Agency"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Email</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="james@growthlab.io"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Phone</label>
              <input
                value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+971 50 000 0000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Source</label>
              <input
                value={form.source} onChange={e => set('source', e.target.value)}
                placeholder="LinkedIn"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Stage</label>
              <select
                value={form.stage} onChange={e => set('stage', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              >
                {['new','contacted','qualified','proposal','negotiation'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Deal Value ($)</label>
              <input
                type="number" value={form.value} onChange={e => set('value', e.target.value)}
                placeholder="5000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Notes</label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any context about this lead — what they need, what was discussed..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500 resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-all disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Lead'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
