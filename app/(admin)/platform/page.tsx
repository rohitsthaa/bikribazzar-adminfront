import { redirect } from 'next/navigation';
import { getPlatformOverview } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import PlatformOverview from './PlatformOverview';

export const dynamic = 'force-dynamic';

export default async function PlatformPage() {
  const admin = await getAdmin();
  if (admin?.role !== 'super') redirect('/dashboard');

  const overview = await getPlatformOverview().catch(() => null);

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
          Bikri Bazaar
        </p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Platform Overview</h1>
        <p className="text-sm text-stone-400 mt-1">
          {overview
            ? `${overview.totals.active} active store${overview.totals.active !== 1 ? 's' : ''} · ${overview.totals.orders.toLocaleString()} orders all-time`
            : 'Manage all stores on this platform.'}
        </p>
      </div>

      {overview ? (
        <PlatformOverview data={overview} />
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-stone-400">Could not load platform data — check API connectivity.</p>
        </div>
      )}
    </main>
  );
}
