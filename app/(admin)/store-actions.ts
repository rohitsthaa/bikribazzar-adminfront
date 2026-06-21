'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { STORE_COOKIE } from '@/lib/store-context';
import { getAdmin } from '@/lib/auth';

function writeStoreCookie(storeId: string) {
  cookies().set(STORE_COOKIE, storeId, {
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
  writeStoreCookie(storeId);
  revalidatePath('/', 'layout');
}

/** "Enter" a store from the platform lobby: set context, then open its dashboard. */
export async function enterStore(storeId: string) {
  const admin = await getAdmin();
  if (admin?.role !== 'super') return;
  writeStoreCookie(storeId);
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
