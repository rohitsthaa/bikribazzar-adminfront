import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

/**
 * Proxy for starting a Fonepay QR payment against a subscription invoice (self-serve upgrade —
 * docs/SUBSCRIPTIONS_PLAN.md). Like the eSewa/Khalti billing proxies, this requires an
 * authenticated admin session — there's no anonymous-checkout equivalent for billing. Fonepay is
 * QR + poll rather than a redirect: the response carries a qrString the client renders, then polls
 * /api/billing/fonepay/verify until it settles.
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

  const upstream = await fetch(`${API_BASE}/payments/fonepay/initiate`, {
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
