import { NextResponse } from 'next/server';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/signout
 * Server-side sign-out that properly clears SSR cookies.
 * The client-side signOut() alone can't clear httpOnly cookies,
 * so this route ensures a clean sign-out.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    const supabase = createSSRClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[signout] Error:', error);
    // Even if signout fails, return success so the client can proceed
    return NextResponse.json({ success: true });
  }
}
