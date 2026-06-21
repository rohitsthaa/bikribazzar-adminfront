import { cookies } from 'next/headers';
import { cache } from 'react';

// Two auth paths during the transition:
//  - `st_admin_token`: a JWT from the API admin_users login (role + storeId).
//  - `st_admin`: the legacy shared ADMIN_PASSWORD cookie (always super-admin).
// Legacy is kept as a fallback so we can't get locked out; remove it once the
// email/password login is verified in production.
const TOKEN_COOKIE = 'st_admin_token';
const LEGACY_COOKIE = 'st_admin';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

export type AdminRole = 'super' | 'store';
export type AdminIdentity = {
  id: number | null;
  email: string;
  role: AdminRole;
  storeId: string | null;
};

/**
 * Resolve the current admin from the request cookies. Returns null when not
 * authenticated. Cached per-request so repeated calls don't re-hit the API.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const store = cookies();

  // 1) Preferred: JWT from admin_users — validated by the API.
  const token = store.get(TOKEN_COOKIE)?.value;
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/admin-auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const a = await res.json();
        return { id: a.id, email: a.email, role: a.role, storeId: a.storeId };
      }
    } catch {
      // fall through to legacy
    }
  }

  // 2) Legacy fallback: shared password cookie → synthetic super-admin.
  const legacy = store.get(LEGACY_COOKIE)?.value;
  if (legacy && legacy === process.env.ADMIN_PASSWORD) {
    return { id: null, email: 'legacy-admin', role: 'super', storeId: null };
  }

  return null;
});

export async function isAuthenticated(): Promise<boolean> {
  return (await getAdmin()) !== null;
}

/** Try the API admin_users login; on success set the JWT cookie. */
export async function loginWithCredentials(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const { token } = await res.json();
    if (!token) return false;
    cookies().set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return true;
  } catch {
    return false;
  }
}

/** Legacy fallback: set the shared-password cookie if it matches. */
export function setLegacyAuthCookie(password: string): boolean {
  const correct = !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
  if (correct) {
    cookies().set(LEGACY_COOKIE, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return correct;
}

export function clearAuthCookie() {
  cookies().delete(TOKEN_COOKIE);
  cookies().delete(LEGACY_COOKIE);
}
