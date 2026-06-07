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
