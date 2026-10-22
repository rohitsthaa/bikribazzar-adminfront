import { redirect } from 'next/navigation';
import { getSettings, getPaymentGatewayConfig } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';
import SettingsNav from '@/components/SettingsNav';
import PaymentsClient from './PaymentsClient';

export const metadata = { title: 'Payments — Settings' };

export default async function SettingsPaymentsPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) redirect('/dashboard'); // staff can't change store settings

  const [settings, paymentGateways] = await Promise.all([getSettings(), getPaymentGatewayConfig()]);
  const storeId = await currentStoreId();

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">How customers pay you</p>
      </div>
      <SettingsNav />
      {/* key on the active store forces a fresh remount when switching stores, so the form
          re-seeds its useState from the new store's values. */}
      <PaymentsClient
        key={storeId}
        initialPaymentQr={settings.payment_qr ?? ''}
        initialBankTransferEnabled={settings.payment_bank_transfer_enabled === 'true'}
        initialPaymentGateways={paymentGateways}
      />
    </main>
  );
}
