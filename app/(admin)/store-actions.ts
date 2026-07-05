'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { STORE_COOKIE, encodeStoreCookie } from '@/lib/store-context';
import { getAdmin } from '@/lib/auth';
import { getStore } from '@/lib/api';

// Fingerprints the cookie with the store's createdAt so a later slug reuse (the
// store gets soft-deleted, a different store later takes the freed slug) can be
// detected on read — see lib/store-context.ts. Falls back to a bare
// (unfingerprinted) cookie if the lookup fails for any reason; that's exactly
// this code's pre-fix behavior, not a regression.
async function writeStoreCookie(storeId: string) {
  let value = storeId;
  try {
    const store = await getStore(storeId);
    if (store.createdAt) value = encodeStoreCookie(storeId, store.createdAt);
  } catch {
    // Fall through with the bare id.
  }
  cookies().set(STORE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Switch which store the admin is managing (super-admin only). Quick-switch — stays on the current page. */
export async function setStore(storeId: string) {
  // Store-admins are pinned to their own store — never let them switch.
  const admin = await getAdmin();
  if (admin?.role !== 'super') return;
  await writeStoreCookie(storeId);
  revalidatePath('/', 'layout');
}

/** "Enter" a store from the platform lobby: set context, then open its dashboard. */
export async function enterStore(storeId: string) {
  const admin = await getAdmin();
  if (admin?.role !== 'super') return;
  await writeStoreCookie(storeId);
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
