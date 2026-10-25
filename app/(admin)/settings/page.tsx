import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';
import SettingsNav from '@/components/SettingsNav';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) redirect('/dashboard'); // staff can't change store settings
  const settings = await getSettings();
  const storeId = await currentStoreId();

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your store's identity and appearance</p>
      </div>
      <SettingsNav />
      {/* key on the active store forces a fresh remount when switching stores,
          so the client form re-seeds its useState from the new store's values. */}
      <SettingsClient
        key={storeId}
        initialPhone={settings.contact_phone ?? ''}
        initialInstagram={settings.contact_instagram ?? ''}
        initialFacebook={settings.contact_facebook ?? ''}
        initialYoutube={settings.contact_youtube ?? ''}
        initialTiktok={settings.contact_tiktok ?? ''}
        initialPinterest={settings.contact_pinterest ?? ''}
        initialX={settings.contact_x ?? ''}
        initialContactEmail={settings.contact_email ?? ''}
        initialLocation={settings.contact_location ?? ''}
        initialCurrency={settings.currency_symbol ?? 'NPR'}
        initialTagline={settings.tagline ?? ''}
        initialMetaDescription={settings.meta_description ?? ''}
        initialLogoUrl={settings.logo_url ?? ''}
        initialOgImage={settings.og_image ?? ''}
        initialShopTitle={settings.shop_title ?? ''}
        initialShopSubtitle={settings.shop_subtitle ?? ''}
        initialDeliveryNote={settings.delivery_note ?? ''}
        initialReturnsNote={settings.returns_note ?? ''}
        initialEmailOrderSubject={settings.email_order_subject ?? 'Order Confirmed — {storeName}'}
        initialEmailOrderHeading={settings.email_order_heading ?? 'Order confirmed'}
        initialEmailOrderMessage={settings.email_order_message ?? 'Hi {customerName}, thank you for your order!'}
        initialEmailOrderButton={settings.email_order_button ?? 'Track your order'}
        initialEmailUpdateSubject={settings.email_update_subject ?? 'Order update — {storeName}'}
        initialEmailUpdateHeading={settings.email_update_heading ?? 'An update on your order'}
        initialEmailUpdateMessage={settings.email_update_message ?? 'Hi {customerName}, {status}.'}
        initialEmailUpdateButton={settings.email_update_button ?? 'Track your order'}
        initialAdminEmail={admin?.email ?? ''}
      />
    </main>
  );
}
