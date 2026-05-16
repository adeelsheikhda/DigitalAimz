'use client'

import { cn, formatCurrency, agentColor, agentIcon } from '@/lib/utils'
import type { Briefing } from '@/types'

interface BriefingCardProps {
  briefing: Briefing
}

const moodConfig = {
  excellent: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', label: 'Excellent' },
  good: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Good' },
  concerning: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', label: 'Concerning' },
  critical: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Critical' },
}

export function BriefingCard({ briefing }: BriefingCardProps) {
  const kpis = briefing.kpis as Record<string, number>
  const alerts = briefing.alerts ?? []
  const tasks = briefing.tasks_assigned ?? []

  const deptSummaries = [
    { key: 'hr', summary: briefing.hr_summary },
    { key: 'sales', summary: briefing.sales_summary },
    { key: 'finance', summary: briefing.finance_summary },
    { key: 'marketing', summary: briefing.marketing_summary },
    { key: 'seo', summary: briefing.seo_summary },
  ]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Morning Briefing</h2>
          <span className="text-zinc-500 text-xs">
            {new Date(briefing.briefing_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{briefing.summary}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Pipeline', value: formatCurrency(kpis?.pipeline_value ?? 0), icon: '💰' },
          { label: 'Overdue', value: formatCurrency(kpis?.overdue_amount ?? 0), icon: '🔴', urgent: (kpis?.overdue_amount ?? 0) > 0 },
          { label: 'Decisions', value: String(kpis?.pending_decisions ?? 0), icon: '⚡' },
          { label: 'Leads', value: String(kpis?.leads_count ?? 0), icon: '📋' },
          { label: 'Content', value: String(kpis?.content_published ?? 0), icon: '📱' },
        ].map(kpi => (
          <div key={kpi.label} className={cn(
            'rounded-lg border p-3',
            kpi.urgent ? 'border-red-500/20 bg-red-500/5' : 'border-zinc-800 bg-zinc-900/30'
          )}>
            <p className="text-zinc-500 text-xs mb-1">{kpi.icon} {kpi.label}</p>
            <p className={cn('font-semibold text-base', kpi.urgent ? 'text-red-400' : 'text-white')}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-3">Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={cn(
                'flex items-start gap-2 text-xs p-2 rounded-lg',
                alert.level === 'critical' ? 'bg-red-500/10 text-red-300' :
                alert.level === 'warning' ? 'bg-yellow-500/10 text-yellow-300' :
                'bg-blue-500/10 text-blue-300'
              )}>
                <span>{alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '🟡' : '🔵'}</span>
                <span className="leading-relaxed">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-3">Today's Tasks</h3>
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded-full border shrink-0',
                  agentColor(task.department)
                )}>
                  {agentIcon(task.department)}
                </span>
                <div className="flex-1">
                  <p className="text-zinc-300">{task.task}</p>
                  <p className="text-zinc-600 mt-0.5">{task.priority.toUpperCase()} • {task.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department summaries */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-3">Department Status</h3>
        <div className="space-y-2.5">
          {deptSummaries.map(({ key, summary }) => (
            <div key={key} className="flex items-start gap-2.5 text-xs">
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full border shrink-0',
                agentColor(key)
              )}>
                {agentIcon(key)} {key.toUpperCase()}
              </span>
              <p className="text-zinc-400 leading-relaxed pt-0.5">{summary ?? 'No data'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
