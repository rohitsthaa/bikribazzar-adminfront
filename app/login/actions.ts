'use server';
import { redirect } from 'next/navigation';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth';

export async function login(_: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  const ok = setAuthCookie(password);
  if (!ok) return { error: 'Wrong password.' };
  redirect('/');
}

export async function logout() {
  clearAuthCookie();
  redirect('/login');
}
