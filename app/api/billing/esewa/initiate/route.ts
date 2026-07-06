import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

/**
 * Proxy for starting an eSewa payment against a subscription invoice (self-serve upgrade —
 * docs/SUBSCRIPTIONS_PLAN.md). Mirrors soulthreadktm's app/api/payments/esewa/initiate/route.ts
 * but, unlike that customer-facing proxy, this one requires an authenticated admin session —
 * there's no anonymous-checkout equivalent for billing, so we don't want an unauthenticated
 * visitor able to spin up Payment rows against whatever store currentStoreId() would otherwise
 * default to.
 */

export const runtime = 'nodejs';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin.role, 'settings')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.text();
  const storeId = await currentStoreId();

  const upstream = await fetch(`${API_BASE}/payments/esewa/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-store-id': storeId,
      'x-internal-token': TOKEN,
    },
    body,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
