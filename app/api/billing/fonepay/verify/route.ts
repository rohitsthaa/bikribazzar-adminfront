import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

/**
 * Proxy for polling a Fonepay QR payment's status (self-serve upgrade —
 * docs/SUBSCRIPTIONS_PLAN.md). The client calls this on a short interval while the QR is on
 * screen. Requires an authenticated admin session, same as the initiate proxy. The upstream
 * returns { ok, status: COMPLETE | PENDING | FAILED }; PENDING comes back 200 so the client
 * keeps polling, COMPLETE means the invoice was marked paid.
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

  const upstream = await fetch(`${API_BASE}/payments/fonepay/verify`, {
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
