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

export async function saveContactInfo(whatsapp: string, instagram: string, email: string, location: string) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('contact_whatsapp', whatsapp),
    updateSetting('contact_instagram', instagram),
    updateSetting('contact_email', email),
    updateSetting('contact_location', location),
  ]);
  revalidatePath('/settings');
}

export async function saveCategories(categories: Array<{ key: string; label: string }>) {
  await assertCanSettings();
  await updateSetting('product_categories', JSON.stringify(categories));
  revalidatePath('/settings');
}

export async function saveCurrency(symbol: string) {
  await assertCanSettings();
  await updateSetting('currency_symbol', symbol.trim() || 'NPR');
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
