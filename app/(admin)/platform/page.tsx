import { redirect } from 'next/navigation';
import { getPlatformOverview } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import PlatformOverview from './PlatformOverview';
import NewStoreDialog from './NewStoreDialog';

export const dynamic = 'force-dynamic';

export default async function PlatformPage() {
  const admin = await getAdmin();
  if (admin?.role !== 'super') redirect('/dashboard');

  const overview = await getPlatformOverview().catch(() => null);

  return (
    <main className="p-6 md:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Platform</h1>
          <p className="text-sm text-stone-400 mt-0.5">Manage all stores on this platform.</p>
        </div>
        <NewStoreDialog />
      </div>

      {overview ? (
        <PlatformOverview data={overview} />
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center text-sm text-stone-400">
          Could not load platform data.
        </div>
      )}
    </main>
  );
}
