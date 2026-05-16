import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function formatRelative(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

export function agentColor(agent: string) {
  const colors: Record<string, string> = {
    ceo: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    hr: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    sales: 'text-green-400 bg-green-400/10 border-green-400/20',
    finance: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    marketing: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    seo: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  }
  return colors[agent] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
}

export function agentIcon(agent: string) {
  const icons: Record<string, string> = {
    ceo: '👑',
    hr: '🧑‍💼',
    sales: '💰',
    finance: '📊',
    marketing: '📱',
    seo: '🔍',
  }
  return icons[agent] ?? '🤖'
}
