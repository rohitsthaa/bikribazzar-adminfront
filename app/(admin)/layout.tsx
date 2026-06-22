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
  const stores = isSuper ? await getStores().catch(() => []) : [];
  const current = await currentStoreId();
  const currentStore = isSuper
    ? stores.find((s) => s.id === current)
    : null;

  // Platform mode: super admin is on /platform/** — no specific store in focus.
  // Store mode: everyone else, or super admin who has navigated into a store.
  const isPlatformMode = isSuper && pathname.startsWith('/platform');
  const sidebarMode = isPlatformMode ? 'platform' : 'store';

  // For non-super admins, the store name comes from their own storeId.
  const storeName = currentStore?.name ?? (isSuper ? current : undefined);

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar
        isSuper={isSuper}
        canSettings={can(admin.role, 'settings')}
        mode={sidebarMode}
        storeName={storeName}
      />
      <div className="flex-1 min-w-0 ml-64">
        {/* Store context bar — only in store mode, so the current store is always visible */}
        {!isPlatformMode && (
          <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-2">
            <div className="flex items-center gap-2 text-sm">
              {!isSuper && (
                <span className="text-xs uppercase tracking-wide text-stone-400">Managing</span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {storeName ?? current}
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
