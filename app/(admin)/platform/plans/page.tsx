import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getAllPlans } from '@/lib/api';
import PlansClient from './PlansClient';

export const dynamic = 'force-dynamic';

export default async function PlatformPlansPage() {
  const me = await getAdmin();
  if (me?.role !== 'super') redirect('/dashboard');

  const plans = await getAllPlans().catch(() => []);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Plans</h1>
        <p className="text-sm text-stone-400 mt-1">
          Edit the subscription catalog. New tiers require a migration — this page only edits
          pricing, limits, and features on the plans already seeded, or retires one.
        </p>
      </div>

      <PlansClient plans={plans} />
    </main>
  );
}
