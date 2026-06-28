'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

export type SignupResult =
  | { ok: true; storeId: string; trialEndsAt: string }
  | { ok: false; error: string };

/**
 * Call the public /self-serve/signup endpoint on the API.
 * On success, set the JWT cookie and redirect into the admin dashboard.
 * On failure, return an error message to the client.
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

    // Set the JWT cookie — same format as loginWithCredentials in lib/auth.ts
    cookies().set(TOKEN_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { ok: true, storeId: data.store.id, trialEndsAt: data.store.trialEndsAt };
  } catch (err) {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}

/**
 * Check whether a store slug is available.
 * Called from the client on every slug change (debounced).
 */
export async function checkSlugAction(slug: string): Promise<{ available: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/self-serve/check-slug?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    return res.json();
  } catch {
    return { available: false, error: 'Could not check availability.' };
  }
}
