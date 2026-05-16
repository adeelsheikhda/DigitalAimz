'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddContentForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    platform: 'instagram', content_type: 'reel', title: '', hook: '',
    body: '', cta: '', status: 'draft',
    views: '', likes: '', shares: '', saves: '', comments: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const isPublished = form.status === 'published'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/data/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      setForm({ platform: 'instagram', content_type: 'reel', title: '', hook: '', body: '', cta: '', status: 'draft', views: '', likes: '', shares: '', saves: '', comments: '' })
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
          <span className="text-pink-400">＋</span> Add Content Piece
        </span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Platform</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500">
                {['instagram','tiktok','youtube','linkedin','twitter'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Type</label>
              <select value={form.content_type} onChange={e => set('content_type', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500">
                {['reel','post','story','caption','thread'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500">
                {['draft','approved','published'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Claude = Full Business Team"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Hook (opening line) *</label>
            <input required value={form.hook} onChange={e => set('hook', e.target.value)}
              placeholder="I replaced my entire team with Claude. Here's what happened..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">CTA</label>
            <input value={form.cta} onChange={e => set('cta', e.target.value)}
              placeholder="Follow for more AI business tips"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-pink-500" />
          </div>

          {isPublished && (
            <div>
              <label className="text-zinc-500 text-xs mb-2 block">Performance Stats</label>
              <div className="grid grid-cols-5 gap-2">
                {['views','likes','shares','saves','comments'].map(stat => (
                  <div key={stat}>
                    <label className="text-zinc-600 text-xs mb-1 block capitalize">{stat}</label>
                    <input type="number" value={(form as Record<string, string>)[stat]}
                      onChange={e => set(stat, e.target.value)} placeholder="0"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-pink-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-lg transition-all disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Content'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
