import { createClient } from '@supabase/supabase-js'

// Direct client for API routes — no cookie handling needed
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
