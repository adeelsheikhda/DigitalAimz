import { createClient } from '@/lib/supabase/server'
import { DecisionCard } from '@/components/decision-card'
import { RunAgentButton } from '@/components/run-agent-button'
import { StatCard } from '@/components/stat-card'
import { AddInvoiceForm } from '@/components/forms/add-invoice-form'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Decision, Invoice } from '@/types'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  let invoices: Invoice[] = []
  let decisions: Decision[] = []

  try {
    const supabase = await createClient()
    const [invoicesRes, decisionsRes] = await Promise.all([
      supabase.from('invoices').select('*').order('due_date', { ascending: true }),
      supabase.from('decisions').select('*').eq('agent', 'finance').eq('status', 'pending').order('priority', { ascending: false }),
    ])
    invoices = (invoicesRes.data ?? []) as Invoice[]
    decisions = (decisionsRes.data ?? []) as Decision[]
  } catch {}

  const overdue = invoices.filter(i => i.status === 'overdue')
  const unpaid = invoices.filter(i => i.status === 'unpaid')
  const paid = invoices.filter(i => i.status === 'paid')
  const overdueAmount = overdue.reduce((s, i) => s + Number(i.amount), 0)
  const unpaidAmount = unpaid.reduce((s, i) => s + Number(i.amount), 0)
  const paidAmount = paid.reduce((s, i) => s + Number(i.amount), 0)

  const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'border-green-500/30 text-green-400 bg-green-500/10',
      unpaid: 'border-zinc-700 text-zinc-400',
      overdue: 'border-red-500/30 text-red-400 bg-red-500/10',
      flagged: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
      disputed: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    }
    return styles[status] ?? 'border-zinc-700 text-zinc-400'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 Finance Agent</h1>
          <p className="text-zinc-500 text-sm mt-1">Invoice monitoring · Overdue alerts · Payment reminders</p>
        </div>
        <RunAgentButton agent="finance" label="Finance" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Overdue"
          value={formatCurrency(overdueAmount)}
          sub={`${overdue.length} invoice${overdue.length !== 1 ? 's' : ''}`}
          icon="🔴"
          variant={overdueAmount > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(unpaidAmount)}
          sub={`${unpaid.length} pending`}
          icon="⏳"
          variant={unpaidAmount > 0 ? 'warning' : 'default'}
        />
        <StatCard label="Collected" value={formatCurrency(paidAmount)} sub={`${paid.length} paid`} icon="✅" variant="success" />
        <StatCard label="Total Invoices" value={invoices.length} icon="📋" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice List */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">All Invoices</h2>
          <AddInvoiceForm />
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {invoices.map(inv => (
              <div key={inv.id} className={cn(
                'rounded-xl border bg-zinc-900/50 p-4',
                inv.status === 'overdue' ? 'border-red-500/20' : 'border-zinc-800'
              )}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{inv.client}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{inv.invoice_number ?? 'No invoice #'}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-bold text-base', inv.status === 'overdue' ? 'text-red-400' : 'text-white')}>
                      {formatCurrency(Number(inv.amount), inv.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', statusStyle(inv.status))}>
                    {inv.status}
                  </span>
                  <span className="text-zinc-600 text-xs">Due {formatDate(inv.due_date)}</span>
                  {inv.days_overdue > 0 && (
                    <span className="text-red-400 text-xs font-medium">{inv.days_overdue}d overdue</span>
                  )}
                </div>
                {inv.ai_flag && (
                  <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{inv.ai_flag}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Decisions */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Payment Actions
            {decisions.length > 0 && (
              <span className="ml-2 bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-0.5 rounded-full border border-yellow-500/20">
                {decisions.length}
              </span>
            )}
          </h2>
          {decisions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-500 text-sm">Run the Finance agent to audit invoices and generate reminders.</p>
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
                      if (dec?.payload?.invoice_id) {
                        await supabase.from('invoices').update({ status: 'flagged' }).eq('id', dec.payload.invoice_id)
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
