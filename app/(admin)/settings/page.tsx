import { getSettings } from '@/lib/api';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Site-wide content and appearance</p>
      </div>
      <SettingsClient
        initialAboutImage={settings.about_image ?? ''}
        initialPaymentQr={settings.payment_qr ?? ''}
        initialBankName={settings.payment_bank_name ?? ''}
        initialAccountName={settings.payment_account_name ?? ''}
        initialAccountNo={settings.payment_account_no ?? ''}
        initialWhatsapp={settings.contact_whatsapp ?? ''}
        initialInstagram={settings.contact_instagram ?? ''}
        initialContactEmail={settings.contact_email ?? ''}
        initialLocation={settings.contact_location ?? ''}
        initialCategories={settings.product_categories ?? ''}
      />
    </main>
  );
}
