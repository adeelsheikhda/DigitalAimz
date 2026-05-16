'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'CEO Briefing', icon: '👑', agent: 'ceo' },
  { href: '/hr', label: 'HR', icon: '🧑‍💼', agent: 'hr' },
  { href: '/sales', label: 'Sales', icon: '💰', agent: 'sales' },
  { href: '/finance', label: 'Finance', icon: '📊', agent: 'finance' },
  { href: '/marketing', label: 'Marketing', icon: '📱', agent: 'marketing' },
  { href: '/seo', label: 'SEO', icon: '🔍', agent: 'seo' },
  { href: '/tasks', label: 'Tasks', icon: '📋', agent: 'tasks' },
]

interface NavSidebarProps {
  pendingCounts?: Record<string, number>
}

export function NavSidebar({ pendingCounts = {} }: NavSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col z-50">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm font-bold">
            D
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">DigitalAimz</p>
            <p className="text-zinc-500 text-xs mt-0.5">AI Business OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(item => {
          const isActive = pathname === item.href
          const count = pendingCounts[item.agent] ?? 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </span>
              {count > 0 && (
                <span className="bg-purple-500/20 text-purple-400 text-xs font-medium px-1.5 py-0.5 rounded-full border border-purple-500/20">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="px-3 py-2">
          <p className="text-zinc-600 text-xs">Powered by Claude</p>
        </div>
      </div>
    </aside>
  )
}
