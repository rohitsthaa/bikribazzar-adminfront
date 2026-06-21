import { cookies } from 'next/headers';
import { getAdmin } from './auth';

/**
 * Which store the admin is currently managing.
 *  - super-admin: switchable, stored in a cookie (defaults to the first tenant).
 *  - store-admin: ALWAYS locked to their own storeId — the cookie is ignored, so
 *    they can never act on another tenant's data.
 * Every admin API call is scoped to this store (see lib/api.ts).
 */
export const STORE_COOKIE = 'st_store';
export const DEFAULT_STORE = 'soul-thread';

export async function currentStoreId(): Promise<string> {
  const admin = await getAdmin();
  // Store-admins are pinned to their own store regardless of any cookie.
  if (admin?.role === 'store' && admin.storeId) return admin.storeId;
  // Super-admins (and legacy) may switch.
  return cookies().get(STORE_COOKIE)?.value || DEFAULT_STORE;
}

/** Whether the current admin is allowed to switch stores (super-admins only). */
export async function canSwitchStores(): Promise<boolean> {
  const admin = await getAdmin();
  return admin?.role === 'super';
}
