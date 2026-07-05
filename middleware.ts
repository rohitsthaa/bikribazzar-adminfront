import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE = 'st_admin_token'; // JWT from admin_users login
const PUBLIC = ['/login', '/signup', '/verify-email'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Coarse gate only: a credential cookie must be present. The layout's
  // getAdmin() does the authoritative validation (verifies the JWT via the API)
  // and redirects if it's actually invalid. The legacy shared-ADMIN_PASSWORD
  // cookie check was removed 2026-07-06 — see docs/HANDOFF.md.
  const hasToken = !!req.cookies.get(TOKEN_COOKIE)?.value;

  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Pass pathname as a REQUEST header so server components can read it via headers().
  // Note: response.headers.set() sets a *response* header (sent to browser) — it is
  // NOT available to server components. Request headers set here ARE available.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
