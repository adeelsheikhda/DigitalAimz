import type { Metadata } from 'next'
import './globals.css'
import { NavSidebar } from '@/components/nav-sidebar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'DigitalAimz — AI Business OS',
  description: 'Claude-powered business operating system: HR, Sales, Finance, Marketing, SEO, CEO agent.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let pendingCounts: Record<string, number> = {}

  try {
    const supabase = await createClient()
    const { data: pending } = await supabase
      .from('decisions')
      .select('agent')
      .eq('status', 'pending')

    pendingCounts = (pending ?? []).reduce<Record<string, number>>((acc, d) => {
      acc[d.agent] = (acc[d.agent] ?? 0) + 1
      return acc
    }, {})
  } catch {}

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen">
        <NavSidebar pendingCounts={pendingCounts} />
        <main className="ml-56 min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
