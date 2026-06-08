'use server';

import { revalidatePath } from 'next/cache';
import { updateSetting } from '@/lib/api';

export async function saveAboutImage(url: string) {
  await updateSetting('about_image', url);
  revalidatePath('/settings');
}

export async function savePaymentQr(url: string) {
  await updateSetting('payment_qr', url);
  revalidatePath('/settings');
}

export async function saveBankDetails(bankName: string, accountName: string, accountNo: string) {
  await Promise.all([
    updateSetting('payment_bank_name', bankName),
    updateSetting('payment_account_name', accountName),
    updateSetting('payment_account_no', accountNo),
  ]);
  revalidatePath('/settings');
}

export async function saveContactInfo(whatsapp: string, instagram: string, email: string, location: string) {
  await Promise.all([
    updateSetting('contact_whatsapp', whatsapp),
    updateSetting('contact_instagram', instagram),
    updateSetting('contact_email', email),
    updateSetting('contact_location', location),
  ]);
  revalidatePath('/settings');
}

export async function saveCategories(categories: Array<{ key: string; label: string }>) {
  await updateSetting('product_categories', JSON.stringify(categories));
  revalidatePath('/settings');
}
