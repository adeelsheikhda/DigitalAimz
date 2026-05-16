'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddInvoiceForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    client: '', amount: '', currency: 'USD',
    issued_date: today, due_date: '', invoice_number: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/data/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      setForm({ client: '', amount: '', currency: 'USD', issued_date: today, due_date: '', invoice_number: '' })
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
          <span className="text-yellow-400">＋</span> Add New Invoice
        </span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Client Name *</label>
              <input
                required value={form.client} onChange={e => set('client', e.target.value)}
                placeholder="GrowthLab Agency"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Invoice Number</label>
              <input
                value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)}
                placeholder="INV-2026-001"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Amount *</label>
              <input
                required type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="2500"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Currency</label>
              <select
                value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                {['USD','GBP','EUR','AED','PKR'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Issued Date *</label>
              <input
                required type="date" value={form.issued_date} onChange={e => set('issued_date', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Due Date *</label>
              <input
                required type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
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
              className="flex-1 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-all disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Invoice'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
