import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StoreSwitcher from '@/components/StoreSwitcher';
import { getStores } from '@/lib/api';
import { currentStoreId } from '@/lib/store-context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const pathname = headers().get('x-pathname') ?? '';
  if (pathname.endsWith('/print')) {
    return <>{children}</>;
  }

  const isSuper = admin.role === 'super';
  // Super-admins can list/switch stores; store-admins only ever see their own.
  const stores = isSuper ? await getStores().catch(() => []) : [];
  const current = await currentStoreId();
  const currentStore = stores.find((s) => s.id === current);

  // Always show the level bar: supers get the Platform ▸ store breadcrumb (so
  // they can always pop back to the lobby), store-scoped admins see their store.
  const showBar = true;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar isSuper={isSuper} canSettings={can(admin.role, 'settings')} />
      <div className="flex-1 min-w-0 ml-64">
        {showBar && (
          <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-2">
            {/* Level indicator: for a super-admin show Platform ▸ <store> so they
                always know which level they're on and can pop back up. Every
                product/setting change lands on the highlighted store. */}
            <div className="flex items-center gap-2 text-sm">
              {isSuper && (
                <>
                  <Link href="/platform" className="text-stone-500 hover:text-stone-900 font-medium">Platform</Link>
                  <span className="text-stone-300">▸</span>
                </>
              )}
              {!isSuper && <span className="text-xs uppercase tracking-wide text-stone-400">Managing</span>}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {currentStore?.name ?? current}
              </span>
            </div>
            {isSuper && stores.length > 1 && <StoreSwitcher stores={stores} current={current} />}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
