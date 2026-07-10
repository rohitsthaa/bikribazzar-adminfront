import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { getStore, getPlans, getStoreInvoices } from '@/lib/api';
import { currentStoreId } from '@/lib/store-context';
import BillingUpgradeClient from './BillingUpgradeClient';

export const metadata = { title: 'Billing — Admin' };
export const dynamic = 'force-dynamic';

interface Props { searchParams?: Promise<{ upgraded?: string }> }

export default async function BillingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const admin = await getAdmin();
  // Platform super-admins manage billing per-store from Platform → a store's own page
  // (BillingClient there) — this page is the store owner's self-serve view of the same data.
  if (admin?.role === 'super') redirect('/platform');
  if (!can(admin?.role, 'settings')) redirect('/dashboard');

  const storeId = await currentStoreId();
  const [store, plans, invoices] = await Promise.all([
    getStore(storeId),
    getPlans().catch(() => []),
    getStoreInvoices(storeId).catch(() => []),
  ]);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Billing</h1>
        <p className="text-sm text-stone-400 mt-0.5">Your plan, upgrades, and invoice history.</p>
      </div>

      {sp?.upgraded === '1' && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Payment confirmed — your plan has been upgraded.
        </div>
      )}

      <BillingUpgradeClient
        plan={store.plan}
        subscriptionStatus={store.subscriptionStatus}
        trialEndsAt={store.trialEndsAt}
        nextBillingAt={store.nextBillingAt}
        plans={plans}
        invoices={invoices}
      />
    </main>
  );
}
