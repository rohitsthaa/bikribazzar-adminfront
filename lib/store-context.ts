import { cookies } from 'next/headers';
import { cache } from 'react';
import { getAdmin } from './auth';

/**
 * Which store the admin is currently managing.
 *  - super-admin: switchable, stored in a cookie (defaults to the first tenant).
 *  - store-admin: ALWAYS locked to their own storeId — the cookie is ignored, so
 *    they can never act on another tenant's data.
 * Every admin API call is scoped to this store (see lib/api.ts).
 *
 * Cookie format is `${storeId}::${createdAtIso}` — the createdAt fingerprint guards
 * against a real (if rare) failure mode: a store's slug (== its id) can be freed up
 * on soft-delete and reused by a completely unrelated store later (see "Slug reuse
 * on delete" in docs/HANDOFF.md). The cookie has a 30-day maxAge, so a super-admin
 * who had a store open, stepped away, and came back after that store was deleted +
 * its slug reused would otherwise silently start managing the WRONG store — same
 * id, same UI chrome, a completely different tenant's data underneath, with no
 * indication anything changed. Embedding createdAt lets `currentStoreId()` detect
 * that swap and fall back to the default instead of trusting a slug that no longer
 * means what it used to.
 *
 * Cookies written before this fix have no `::` separator — treated as unfingerprinted
 * and trusted as-is (not re-validated), so existing sessions aren't force-reset on
 * deploy. Every *new* write goes through `writeStoreCookie` in
 * app/(admin)/store-actions.ts, which always includes the fingerprint, so the whole
 * fleet of cookies self-upgrades over the following 30 days as admins switch stores.
 */
export const STORE_COOKIE = 'st_store';
export const DEFAULT_STORE = 'soul-thread';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

export function encodeStoreCookie(id: string, createdAt: string): string {
  return `${id}::${createdAt}`;
}

function parseStoreCookie(raw: string | undefined): { id: string; createdAt: string | null } | null {
  if (!raw) return null;
  const sep = raw.indexOf('::');
  if (sep === -1) return { id: raw, createdAt: null }; // pre-fingerprint cookie — trust as-is
  return { id: raw.slice(0, sep), createdAt: raw.slice(sep + 2) };
}

// Fresh-per-request check that `id` still refers to the same store the cookie was
// written for. Wrapped in React's cache() so the many currentStoreId() calls that
// happen within a single request only hit the API once. Deliberately a raw fetch
// (not lib/api.ts's apiFetch) — apiFetch itself calls currentStoreId() to build the
// x-store-id header, which would recurse.
const isStoreFingerprintValid = cache(async (id: string, createdAt: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/stores/${encodeURIComponent(id)}`, {
      headers: { 'x-internal-token': INTERNAL_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) return false; // store gone entirely (or truly never existed) — stale
    const store = (await res.json()) as { createdAt?: string };
    return store.createdAt === createdAt;
  } catch {
    // API unreachable — fail open. A transient network blip shouldn't bounce
    // every super-admin back to the default store mid-session.
    return true;
  }
});

export async function currentStoreId(): Promise<string> {
  const admin = await getAdmin();
  // Store-scoped roles (store-admin, staff) are pinned to their own store
  // regardless of any cookie.
  if (admin && admin.role !== 'super' && admin.storeId) return admin.storeId;

  // Super-admins (and legacy) may switch.
  const parsed = parseStoreCookie(cookies().get(STORE_COOKIE)?.value);
  if (!parsed) return DEFAULT_STORE;
  if (parsed.createdAt && !(await isStoreFingerprintValid(parsed.id, parsed.createdAt))) {
    return DEFAULT_STORE;
  }
  return parsed.id;
}

/** Whether the current admin is allowed to switch stores (super-admins only). */
export async function canSwitchStores(): Promise<boolean> {
  const admin = await getAdmin();
  return admin?.role === 'super';
}
