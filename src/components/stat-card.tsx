import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: string
  variant?: 'default' | 'danger' | 'success' | 'warning'
}

const variants = {
  default: 'border-zinc-800 bg-zinc-900/30',
  danger: 'border-red-500/20 bg-red-500/5',
  success: 'border-green-500/20 bg-green-500/5',
  warning: 'border-yellow-500/20 bg-yellow-500/5',
}

const valueVariants = {
  default: 'text-white',
  danger: 'text-red-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
}

export function StatCard({ label, value, sub, icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border p-4', variants[variant])}>
      <p className="text-zinc-500 text-xs mb-1.5">{icon && `${icon} `}{label}</p>
      <p className={cn('font-bold text-2xl leading-none mb-1', valueVariants[variant])}>{value}</p>
      {sub && <p className="text-zinc-600 text-xs">{sub}</p>}
    </div>
  )
}
