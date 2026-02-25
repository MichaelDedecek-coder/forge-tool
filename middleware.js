/**
 * Next.js Middleware
 * - Supabase Auth session management (when configured)
 * - Hostname-based routing for ailab-cl.cz
 */

import { NextResponse } from 'next/server';

export async function middleware(req) {
  // Hostname-based routing for ailab-cl.cz
  const hostname = req.headers.get('host');
  if (hostname === 'ailab-cl.cz' || hostname === 'www.ailab-cl.cz') {
    const url = req.nextUrl.clone();
    url.pathname = `/lab${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Skip Supabase auth if env vars not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  // Supabase Auth session refresh
  const { createServerClient } = await import('@supabase/ssr');

  let res = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getSession();

  return res;
}

// Match all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
