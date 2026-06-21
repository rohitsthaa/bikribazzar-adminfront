'use server';
import { redirect } from 'next/navigation';
import { loginWithCredentials, setLegacyAuthCookie, clearAuthCookie } from '@/lib/auth';

export async function login(_: unknown, formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim();
  const password = (formData.get('password') as string) ?? '';

  if (!password) return { error: 'Password required.' };

  // Preferred: email + password against the admin_users table.
  if (email) {
    const ok = await loginWithCredentials(email, password);
    if (ok) redirect('/');
    return { error: 'Invalid email or password.' };
  }

  // Legacy fallback: password only (shared ADMIN_PASSWORD) → super-admin.
  const legacyOk = setLegacyAuthCookie(password);
  if (legacyOk) redirect('/');
  return { error: 'Enter your email and password.' };
}

export async function logout() {
  clearAuthCookie();
  redirect('/login');
}
