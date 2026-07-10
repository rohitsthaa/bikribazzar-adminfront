'use server';

import { revalidatePath } from 'next/cache';
import { updateSetting } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';

/** Settings are owner-only (super + store-admin); staff are blocked. */
async function assertCanSettings() {
  const me = await getAdmin();
  if (!can(me?.role, 'settings')) throw new Error('Forbidden');
}

export async function saveAboutImage(url: string) {
  await assertCanSettings();
  await updateSetting('about_image', url);
  revalidatePath('/settings');
}

export async function savePaymentQr(url: string) {
  await assertCanSettings();
  await updateSetting('payment_qr', url);
  revalidatePath('/settings');
}

export async function saveBankDetails(bankName: string, accountName: string, accountNo: string) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('payment_bank_name', bankName),
    updateSetting('payment_account_name', accountName),
    updateSetting('payment_account_no', accountNo),
  ]);
  revalidatePath('/settings');
}

export async function saveContactInfo(phone: string, instagram: string, email: string, location: string) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('contact_phone', phone),
    updateSetting('contact_instagram', instagram),
    updateSetting('contact_email', email),
    updateSetting('contact_location', location),
  ]);
  revalidatePath('/settings');
}

export async function saveCurrency(symbol: string) {
  await assertCanSettings();
  await updateSetting('currency_symbol', symbol.trim() || 'NPR');
  revalidatePath('/settings');
}

// Default delivery fees, shown to customers at checkout and used whenever a
// product doesn't have its own delivery fee override. `delivery_fee` applies
// to Kathmandu Valley areas, `nationwide_fee` to "Outside Valley" orders —
// the API computes the actual per-order fee server-side from these plus any
// per-product override (see ProductForm's "Delivery fee override" field).
export async function saveDeliveryFees(valleyFeeNpr: string, nationwideFeeNpr: string) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('delivery_fee', valleyFeeNpr.trim() || '0'),
    updateSetting('nationwide_fee', nationwideFeeNpr.trim() || '0'),
  ]);
  revalidatePath('/settings');
}

export async function saveBranding(data: {
  tagline: string; metaDescription: string; fontFamily: string; logoUrl: string; ogImage: string;
}) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('tagline', data.tagline.trim()),
    updateSetting('meta_description', data.metaDescription.trim()),
    updateSetting('font_family', data.fontFamily.trim()),
    updateSetting('logo_url', data.logoUrl.trim()),
    updateSetting('og_image', data.ogImage.trim()),
  ]);
  revalidatePath('/settings');
}
