import { runAgentJSON } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { Invoice } from '@/types'

interface FinanceAlert {
  severity: 'critical' | 'high' | 'medium'
  action: string
  reminder_email: string
  reminder_subject: string
  collection_strategy: string
}

export async function auditInvoices(): Promise<{
  decisions: Array<{ title: string; description: string; priority: number; payload: Record<string, unknown> }>
  processed: number
  total_overdue: number
}> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .not('status', 'eq', 'paid')
    .order('due_date', { ascending: true })

  if (!invoices?.length) return { decisions: [], processed: 0, total_overdue: 0 }

  const decisions = []
  let total_overdue = 0

  for (const invoice of invoices as Invoice[]) {
    const today = new Date()
    const dueDate = new Date(invoice.due_date)
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000))
    const daysUntilDue = Math.max(0, Math.floor((dueDate.getTime() - today.getTime()) / 86400000))
    const isOverdue = daysOverdue > 0

    if (isOverdue) total_overdue += invoice.amount

    if (daysOverdue > 0 || daysUntilDue <= 3) {
      const result = await runAgentJSON<FinanceAlert>(
        `You are the finance director for DigitalAimz, a digital marketing agency.
You handle AR with professionalism — firm but relationship-preserving.
Draft clear, specific payment reminder emails.`,
        `Generate a payment reminder for this invoice:

Client: ${invoice.client}
Invoice #: ${invoice.invoice_number ?? 'N/A'}
Amount: ${invoice.amount} ${invoice.currency}
Due Date: ${invoice.due_date}
Days Overdue: ${daysOverdue}
Days Until Due: ${daysUntilDue}
Current Status: ${invoice.status}

Return JSON:
{
  "severity": "<critical|high|medium>",
  "action": "<specific action to take>",
  "reminder_subject": "<email subject>",
  "reminder_email": "<full professional email body>",
  "collection_strategy": "<1-2 sentence strategy>"
}`
      )

      if (isOverdue) {
        await supabase
          .from('invoices')
          .update({ status: 'overdue', ai_flag: result.collection_strategy })
          .eq('id', invoice.id)
      }

      decisions.push({
        title: `${isOverdue ? '🔴' : '🟡'} Invoice ${invoice.invoice_number ?? invoice.id.slice(0,8)} — ${invoice.client} ($${invoice.amount})`,
        description: `${isOverdue ? `${daysOverdue} days OVERDUE` : `Due in ${daysUntilDue} days`}\n\nStrategy: ${result.collection_strategy}\n\nAction: ${result.action}`,
        priority: isOverdue ? Math.min(100, 50 + daysOverdue * 2) : 30,
        payload: {
          invoice_id: invoice.id,
          client: invoice.client,
          amount: invoice.amount,
          currency: invoice.currency,
          days_overdue: daysOverdue,
          days_until_due: daysUntilDue,
          subject: result.reminder_subject,
          email_draft: result.reminder_email,
          action: result.action,
          severity: result.severity,
        },
      })
    }
  }

  await supabase.from('agent_logs').insert({
    agent: 'finance',
    action: 'audit_invoices',
    details: { processed: invoices.length, decisions_created: decisions.length, total_overdue },
    success: true,
  })

  return { decisions, processed: invoices.length, total_overdue }
}
