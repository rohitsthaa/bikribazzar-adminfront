import { cookies } from 'next/headers';
import { cache } from 'react';
import { parseAllowedTabs } from './tabs';

// `st_admin_token`: a JWT from the API admin_users login (role + storeId).
// The legacy shared-`ADMIN_PASSWORD` cookie (`st_admin`) was removed 2026-07-06
// once email/password login was verified working in production — see
// docs/HANDOFF.md. `LEGACY_COOKIE` is kept only so `clearAuthCookie()` can
// still scrub any stale cookie a browser might have from before the cutover.
// `TOKEN_COOKIE` is exported so lib/api.ts can forward the raw JWT as an
// Authorization bearer header on every API call — the API cross-checks it
// against x-store-id as defense-in-depth (2026-07-06, see docs/HANDOFF.md).
export const TOKEN_COOKIE = 'st_admin_token';
const LEGACY_COOKIE = 'st_admin';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

export type AdminRole = 'super' | 'store' | 'staff';
export type AdminIdentity = {
  id: number | null;
  email: string;
  role: AdminRole;
  storeId: string | null;
  // Tab keys (see lib/tabs.ts) this admin is restricted to, or null if unrestricted (every
  // tab their role permits — the default, and the only state for non-staff roles in practice).
  allowedTabs: string[] | null;
};

// Capability map. Staff is a store-scoped role that can run the shop day-to-day
// (orders, inventory, products, marketing content) but NOT change store settings
// (payments, contact, categories). Super + store-admin can do everything for
// their scope. Platform console stays super-only (checked separately).
export function can(
  role: AdminRole | undefined,
  action: 'settings' | 'manageAdmins' | 'deleteProduct' | 'setPrice',
): boolean {
  switch (action) {
    case 'settings':
    case 'deleteProduct': // staff can't delete catalog items
    case 'setPrice':      // staff can't change pricing
      return role === 'super' || role === 'store';
    case 'manageAdmins':
      return role === 'super';
    default:
      return false;
  }
}

/**
 * Resolve the current admin from the request cookies. Returns null when not
 * authenticated. Cached per-request so repeated calls don't re-hit the API.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const store = await cookies();

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
        return {
          id: a.id,
          email: a.email,
          role: a.role,
          storeId: a.storeId,
          allowedTabs: parseAllowedTabs(a.allowedTabs),
        };
      }
    } catch {
      // API unreachable or token invalid — fall through to unauthenticated.
    }
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
    (await cookies()).set(TOKEN_COOKIE, token, {
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

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(LEGACY_COOKIE);
  // Also drop the store-context cookie ('st_store', see lib/store-context.ts —
  // duplicated as a literal here rather than importing STORE_COOKIE, to avoid a
  // circular import between auth.ts and store-context.ts, which imports getAdmin
  // from this file). Without this, a super-admin's selected store would survive
  // logout/login on a shared browser, which is the same class of "silently acting
  // on a store you don't realize you're in" risk as the slug-reuse fix.
  store.delete('st_store');
}
