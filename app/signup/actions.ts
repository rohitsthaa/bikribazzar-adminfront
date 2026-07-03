'use server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN_COOKIE = 'st_admin_token';

export type SignupPayload = {
  storeId: string;
  storeName: string;
  templateId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  whatsappNumber: string;
};

// Signup no longer returns a JWT — user must verify email first.
export type SignupResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Call the public /self-serve/signup endpoint.
 * On success: a verification email is sent and we return { ok: true, email }.
 * The user must click the link in their inbox before they can log in.
 */
export async function signupAction(payload: SignupPayload): Promise<SignupResult> {
  try {
    const res = await fetch(`${API_BASE}/self-serve/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error ?? `Signup failed (${res.status})` };
    }

    // API returns { ok, storeId, storeUrl } — echo back the email from the payload
    // so step 3 can display it in the "check your inbox" message.
    return { ok: true, email: payload.ownerEmail };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}

/**
 * Sets the JWT auth cookie after email verification.
 * Called from the /verify-email page once the API returns a token.
 */
export async function setAuthCookieAction(token: string): Promise<void> {
  cookies().set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Check whether a store slug is available.
 * Called from the client on every slug change (debounced).
 */
export async function checkSlugAction(slug: string): Promise<{ available: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/self-serve/slug-check?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    return res.json();
  } catch {
    return { available: false, error: 'Could not check availability.' };
  }
}
