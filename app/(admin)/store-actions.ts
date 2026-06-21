'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { STORE_COOKIE } from '@/lib/store-context';

/** Switch which store the admin is managing (super-admin store switcher). */
export async function setStore(storeId: string) {
  cookies().set(STORE_COOKIE, storeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/', 'layout');
}
