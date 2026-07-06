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
  // Check both NEXT_PUBLIC_ (for client exposure) and plain PLATFORM_DOMAIN (API config).
  const platformDomain =
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ||
    process.env.PLATFORM_DOMAIN ||
    '';
  const storeUrl = currentStore?.customDomain
    ? `https://${currentStore.customDomain}`
    : current
    ? `https://${current}.${platformDomain || 'bikribazaar.com'}`
    : null;

  // The store context bar is only shown when NOT on platform routes.
  // The Sidebar determines its own mode from usePathname() — no prop needed.
  const isPlatformRoute = isSuper && pathname.startsWith('/platform');

  // Server-side enforcement of the per-admin tab restriction (see lib/tabs.ts) — hiding a
  // nav item in the Sidebar is a UX nicety, not a security boundary, so a staff account
  // whose Team-page config hides e.g. Products still can't reach /products/* by typing the
  // URL directly. 'dashboard'/'settings'/'billing' are exempt: Dashboard is always the
  // landing page, and Settings/Team/Billing are already hard-gated by role via canSettings
  // (this check only ever *restricts further*, never grants beyond the role ceiling).
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  const tabExempt = new Set(['dashboard', 'settings', 'billing']);
  if (
    !isPlatformRoute &&
    admin.allowedTabs &&
    firstSegment &&
    !tabExempt.has(firstSegment) &&
    !admin.allowedTabs.includes(firstSegment)
  ) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar
        isSuper={isSuper}
        canSettings={can(admin.role, 'settings')}
        allowedTabs={admin.allowedTabs}
        storeName={storeName}
        storeUrl={storeUrl}
        adminEmail={admin.email}
      />
      <div className="flex-1 min-w-0 ml-0 md:ml-64">
        {!isPlatformRoute && (
          <div className="flex items-center justify-between border-b border-stone-100 bg-white pl-14 pr-6 md:px-6 py-2.5 h-12">
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
