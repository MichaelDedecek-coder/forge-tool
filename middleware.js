import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host');

  if (hostname === 'ailab-cl.cz' || hostname === 'www.ailab-cl.cz') {
    url.pathname = `/lab${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}