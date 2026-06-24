import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Admin client uses the service role key — bypasses RLS.
// Only import this in Server Actions or Route Handlers, never in client components.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
