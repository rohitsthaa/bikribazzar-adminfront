import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = 'st_admin';
const PUBLIC = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;

  if (!token || token !== password) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
