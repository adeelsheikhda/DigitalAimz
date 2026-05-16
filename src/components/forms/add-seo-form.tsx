'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddSeoForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    keyword: '', search_volume: '', keyword_difficulty: '', search_intent: 'informational',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/data/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      setForm({ keyword: '', search_volume: '', keyword_difficulty: '', search_intent: 'informational' })
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
          <span className="text-cyan-400">＋</span> Add Keyword to Research
        </span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-zinc-800 p-4 space-y-3">
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Target Keyword *</label>
            <input
              required value={form.keyword} onChange={e => set('keyword', e.target.value)}
              placeholder="best SEO agency Dubai"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Monthly Searches</label>
              <input
                type="number" value={form.search_volume} onChange={e => set('search_volume', e.target.value)}
                placeholder="1400"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Difficulty (0–100)</label>
              <input
                type="number" min="0" max="100" value={form.keyword_difficulty} onChange={e => set('keyword_difficulty', e.target.value)}
                placeholder="45"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Search Intent</label>
              <select
                value={form.search_intent} onChange={e => set('search_intent', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                {['informational','commercial','transactional','navigational'].map(i => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-zinc-600 text-xs">After adding, run the SEO agent to research competitors and draft the full article.</p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Keyword'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
