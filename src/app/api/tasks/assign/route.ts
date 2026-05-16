import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAgentJSON } from '@/lib/claude'

interface TaskAssignment {
  task_id: string
  department: 'hr' | 'sales' | 'finance' | 'marketing' | 'seo'
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('department', 'unassigned')
      .eq('status', 'todo')

    if (!tasks?.length) {
      return NextResponse.json({ success: true, data: { assigned: 0, message: 'No unassigned tasks' } })
    }

    const assignments = await runAgentJSON<TaskAssignment[]>(
      `You are the CEO of DigitalAimz, a digital marketing and SEO agency.
You assign tasks to the right department based on their content.
Departments: hr (hiring/people), sales (leads/clients/revenue), finance (invoices/payments), marketing (content/reels/hooks), seo (keywords/rankings/content).
Be decisive. Every task must go to exactly one department.`,
      `Assign each of these tasks to the correct department:

${tasks.map((t, i) => `${i + 1}. ID: ${t.id}\n   Title: ${t.title}\n   Description: ${t.description ?? 'none'}`).join('\n\n')}

Return JSON array:
[
  {
    "task_id": "<uuid>",
    "department": "<hr|sales|finance|marketing|seo>",
    "priority": "<high|medium|low>",
    "reasoning": "<one sentence>"
  }
]`
    )

    let assigned = 0
    for (const a of assignments) {
      const { error } = await supabase
        .from('tasks')
        .update({
          department: a.department,
          priority: a.priority,
          ai_assigned: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', a.task_id)

      if (!error) assigned++
    }

    return NextResponse.json({ success: true, data: { assigned, assignments } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
