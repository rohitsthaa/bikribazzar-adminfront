import { cookies } from 'next/headers';

const COOKIE = 'st_admin';

export function isAuthenticated(): boolean {
  const token = cookies().get(COOKIE)?.value;
  return token === process.env.ADMIN_PASSWORD;
}

export function setAuthCookie(password: string): boolean {
  const correct = password === process.env.ADMIN_PASSWORD;
  if (correct) {
    cookies().set(COOKIE, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }
  return correct;
}

export function clearAuthCookie() {
  cookies().delete(COOKIE);
}
