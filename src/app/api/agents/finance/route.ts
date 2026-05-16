import { NextResponse } from 'next/server'
import { auditInvoices } from '@/lib/agents/finance-agent'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const { decisions, processed, total_overdue } = await auditInvoices()

    if (decisions.length > 0) {
      const supabase = await createClient()
      await supabase.from('decisions').insert(
        decisions.map(d => ({
          agent: 'finance',
          title: d.title,
          description: d.description,
          action_type: 'send_payment_reminder',
          payload: d.payload,
          priority: d.priority,
        }))
      )
    }

    return NextResponse.json({
      success: true,
      data: { processed, decisions_created: decisions.length, total_overdue },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(50)

  return NextResponse.json({ success: true, data })
}
