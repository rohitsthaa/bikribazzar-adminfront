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
  const currentStore = isSuper ? stores.find((s) => s.id === current) : null;
  const storeName = currentStore?.name ?? (isSuper ? current : undefined);

  // Build the public storefront URL for the "View store" link in the sidebar.
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? '';
  const storeUrl = currentStore?.customDomain
    ? `https://${currentStore.customDomain}`
    : platformDomain && current
    ? `https://${current}.${platformDomain}`
    : null;

  // The store context bar is only shown when NOT on platform routes.
  // The Sidebar determines its own mode from usePathname() — no prop needed.
  const isPlatformRoute = isSuper && pathname.startsWith('/platform');

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar
        isSuper={isSuper}
        canSettings={can(admin.role, 'settings')}
        storeName={storeName}
        storeUrl={storeUrl}
        adminEmail={admin.email}
      />
      <div className="flex-1 min-w-0 ml-64">
        {!isPlatformRoute && (
          <div className="flex items-center justify-between border-b border-stone-100 bg-white px-6 py-2.5 h-12">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-sm font-medium text-stone-700">{storeName ?? current}</span>
              <span className="text-xs text-stone-400 hidden sm:block">·</span>
              <span className="text-xs text-stone-400 hidden sm:block">store</span>
            </div>
            {isSuper && stores.length > 1 && <StoreSwitcher stores={stores} current={current} />}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
