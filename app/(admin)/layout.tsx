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

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <div className="flex-1 min-w-0 ml-64">
        {stores.length > 1 && (
          <div className="flex justify-end border-b border-stone-200 bg-white px-6 py-2">
            <StoreSwitcher stores={stores} current={current} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
