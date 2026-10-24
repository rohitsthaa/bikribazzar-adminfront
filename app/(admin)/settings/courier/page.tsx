import { redirect } from 'next/navigation';
import SettingsNav from '@/components/SettingsNav';
import { getStore, getStoreCourierConfig } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';
import CourierSettingsClient from './CourierSettingsClient';

export const metadata = { title: 'Courier — Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsCourierPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) redirect('/dashboard');

  const storeId = await currentStoreId();
  const [store, courier] = await Promise.all([
    getStore(storeId),
    getStoreCourierConfig(storeId),
  ]);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure NCM shipping for your store</p>
      </div>
      <SettingsNav />
      <CourierSettingsClient
        key={storeId}
        initialConfig={courier.ncm}
        isDemo={store.isDemo}
      />
    </main>
  );
}
