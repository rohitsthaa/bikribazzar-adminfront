import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

/** Proxy for starting a Khalti payment against a subscription invoice. See esewa/initiate's
 *  sibling route for why this requires an authenticated session (unlike the storefront's
 *  equivalent, which is intentionally anonymous for customer checkout). */

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

  const upstream = await fetch(`${API_BASE}/payments/khalti/initiate`, {
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
