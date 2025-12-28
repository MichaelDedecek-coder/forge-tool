/**
 * Server-side Supabase Client
 * Use this in API routes and server components
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Create server-side Supabase client
 * Use in API routes
 */
export function createServerClient() {
  return createRouteHandlerClient({ cookies });
}

/**
 * Get user from server-side context
 */
export async function getServerUser() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}
