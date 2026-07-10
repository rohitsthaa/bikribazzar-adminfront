'use server';
import { redirect } from 'next/navigation';
import { loginWithCredentials, clearAuthCookie } from '@/lib/auth';

export async function login(_: unknown, formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim();
  const password = (formData.get('password') as string) ?? '';

  if (!email) return { error: 'Email required.' };
  if (!password) return { error: 'Password required.' };

  // Email + password against the admin_users table. The legacy shared-
  // ADMIN_PASSWORD fallback was removed 2026-07-06 once this was verified
  // working in production — see docs/HANDOFF.md.
  const ok = await loginWithCredentials(email, password);
  if (ok) redirect('/');
  return { error: 'Invalid email or password.' };
}

export async function logout() {
  await clearAuthCookie();
  redirect('/login');
}
