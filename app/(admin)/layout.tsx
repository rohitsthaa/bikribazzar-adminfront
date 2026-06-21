import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StoreSwitcher from '@/components/StoreSwitcher';
import { getStores } from '@/lib/api';
import { currentStoreId } from '@/lib/store-context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) redirect('/login');
  const pathname = headers().get('x-pathname') ?? '';
  if (pathname.endsWith('/print')) {
    return <>{children}</>;
  }

  const stores = await getStores().catch(() => []);
  const current = currentStoreId();
  const currentStore = stores.find((s) => s.id === current);

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <div className="flex-1 min-w-0 ml-64">
        {stores.length > 1 && (
          <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-2">
            {/* Make it obvious which tenant is being edited — every product /
                setting change lands on this store. */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-stone-400">Managing</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {currentStore?.name ?? current}
              </span>
            </div>
            <StoreSwitcher stores={stores} current={current} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
