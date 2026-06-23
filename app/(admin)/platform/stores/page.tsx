import { redirect } from 'next/navigation';
import { getPlatformOverview } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import StoresClient from './StoresClient';
import NewStoreDialog from '../NewStoreDialog';

export const dynamic = 'force-dynamic';

export default async function PlatformStoresPage() {
  const admin = await getAdmin();
  if (admin?.role !== 'super') redirect('/dashboard');

  const overview = await getPlatformOverview().catch(() => null);
  const stores = overview?.stores ?? [];

  const active    = stores.filter((s) => s.status === 'active').length;
  const suspended = stores.filter((s) => s.status !== 'active').length;

  const platformDomain =
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ||
    process.env.PLATFORM_DOMAIN ||
    'store.helloworldnepal.com';

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
            Hello World Nepal
          </p>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Stores</h1>
          <p className="text-sm text-stone-400 mt-1">
            {stores.length} total · {active} active{suspended ? ` · ${suspended} suspended` : ''}
          </p>
        </div>
        <NewStoreDialog />
      </div>

      <StoresClient stores={stores} platformDomain={platformDomain} />
    </main>
  );
}
