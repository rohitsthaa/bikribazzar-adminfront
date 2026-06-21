'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { STORE_COOKIE } from '@/lib/store-context';
import { getAdmin } from '@/lib/auth';

/** Switch which store the admin is managing (super-admin only). */
export async function setStore(storeId: string) {
  // Store-admins are pinned to their own store — never let them switch.
  const admin = await getAdmin();
  if (admin?.role !== 'super') return;

  cookies().set(STORE_COOKIE, storeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/', 'layout');
}
