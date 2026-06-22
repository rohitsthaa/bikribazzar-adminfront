import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE = 'st_admin_token'; // JWT from admin_users login
const LEGACY_COOKIE = 'st_admin';      // legacy shared-password fallback
const PUBLIC = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Coarse gate only: a credential cookie must be present. The layout's
  // getAdmin() does the authoritative validation (verifies the JWT via the API,
  // or matches the legacy password) and redirects if it's actually invalid.
  const hasToken = !!req.cookies.get(TOKEN_COOKIE)?.value;
  const legacy = req.cookies.get(LEGACY_COOKIE)?.value;
  const hasLegacy = !!legacy && legacy === process.env.ADMIN_PASSWORD;

  if (!hasToken && !hasLegacy) {
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
