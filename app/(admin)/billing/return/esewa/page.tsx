import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

interface Props { searchParams: Promise<{ data?: string }> }

async function verify(storeId: string, data: string) {
  try {
    const res = await fetch(`${API_BASE}/payments/esewa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId, 'x-internal-token': TOKEN },
      body: JSON.stringify({ data }),
      cache: 'no-store',
    });
    return await res.json();
  } catch {
    return null;
  }
}

/** eSewa redirects the browser here after payment. Verifies server-side (re-checking eSewa's
 *  own HMAC signature — see PaymentEndpoints.cs), then either confirms the upgrade or
 *  reassures the owner that a still-settling payment will finish confirming shortly. */
export default async function EsewaBillingReturnPage({ searchParams }: Props) {
  const admin = await getAdmin();
  if (!admin || !can(admin.role, 'settings')) redirect('/dashboard');

  const storeId = await currentStoreId();
  const data = (await searchParams).data;
  const result = data ? await verify(storeId, data) : null;

  if (result?.ok && result.status === 'COMPLETE') {
    redirect('/billing?upgraded=1');
  }

  return (
    <main className="max-w-md mx-auto px-4 pt-24 pb-16 text-center space-y-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100">
        <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-stone-900">Confirming your payment</h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Thanks! Your eSewa payment is being confirmed. This can take a moment — refresh the
          billing page shortly and your plan should be updated.
        </p>
      </div>
      <Link href="/billing" className="inline-block rounded-lg bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors">
        Back to billing
      </Link>
    </main>
  );
}
