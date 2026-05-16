import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client, amount, currency, due_date, issued_date, invoice_number } = body

    if (!client || !amount || !due_date || !issued_date) {
      return NextResponse.json({ success: false, error: 'Client, amount, and dates are required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        client,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        due_date,
        issued_date,
        invoice_number,
        status: 'unpaid',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}
