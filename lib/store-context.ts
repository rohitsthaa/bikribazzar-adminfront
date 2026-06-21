import { cookies } from 'next/headers';

/**
 * Which store the admin is currently managing. Stored in a cookie so the
 * super-admin can switch stores; defaults to the first tenant. Every admin API
 * call is scoped to this store (see lib/api.ts).
 */
export const STORE_COOKIE = 'st_store';
export const DEFAULT_STORE = 'soul-thread';

export function currentStoreId(): string {
  return cookies().get(STORE_COOKIE)?.value || DEFAULT_STORE;
}
