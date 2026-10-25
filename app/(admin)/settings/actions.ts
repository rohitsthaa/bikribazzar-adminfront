'use server';

import { revalidatePath } from 'next/cache';
import { updateSetting, revalidateStorefront, updatePaymentGatewayConfig, testFonepayConnection, testEsewaConnection, testKhaltiConnection, testNcmConnection, updateStoreCourierConfig, sendTestEmail } from '@/lib/api';
import type { ConnectionTestResult, EmailCopyDraft, FonepayTestResult, TestEmailTemplate } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

/** Settings are owner-only (super + store-admin); staff are blocked. */
async function assertCanSettings() {
  const me = await getAdmin();
  if (!can(me?.role, 'settings')) throw new Error('Forbidden');
}

// The manual bank QR is used for product advances and existing orders. It is not
// exposed as a standalone checkout payment method.
export async function savePaymentQr(url: string) {
  await assertCanSettings();
  await updateSetting('payment_qr', url);
  revalidatePath('/settings');
  await revalidateStorefront();
}

export async function saveContactInfo(data: {
  phone: string; instagram: string; facebook: string; youtube: string;
  tiktok: string; pinterest: string; x: string; email: string; location: string;
}) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('contact_phone', data.phone.trim()),
    updateSetting('contact_instagram', data.instagram.trim()),
    updateSetting('contact_facebook', data.facebook.trim()),
    updateSetting('contact_youtube', data.youtube.trim()),
    updateSetting('contact_tiktok', data.tiktok.trim()),
    updateSetting('contact_pinterest', data.pinterest.trim()),
    updateSetting('contact_x', data.x.trim()),
    updateSetting('contact_email', data.email.trim()),
    updateSetting('contact_location', data.location.trim()),
  ]);
  revalidatePath('/settings');
  await revalidateStorefront();
}

// Store-specific wording that templates used to hardcode (e.g. "Kathmandu Valley in 2–3 days",
// "7-day return") — read by the storefront's lib/shop-context.ts. Blank = neutral default.
export async function saveShopCopy(data: {
  shopTitle: string; shopSubtitle: string; deliveryNote: string; returnsNote: string;
}) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('shop_title', data.shopTitle.trim()),
    updateSetting('shop_subtitle', data.shopSubtitle.trim()),
    updateSetting('delivery_note', data.deliveryNote.trim()),
    updateSetting('returns_note', data.returnsNote.trim()),
  ]);
  revalidatePath('/settings');
  await revalidateStorefront();
}

export async function saveCurrency(symbol: string) {
  await assertCanSettings();
  await updateSetting('currency_symbol', symbol.trim() || 'NPR');
  revalidatePath('/settings');
  await revalidateStorefront();
}

export async function saveBranding(data: {
  tagline: string; metaDescription: string; logoUrl: string; ogImage: string;
}) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('tagline', data.tagline.trim()),
    updateSetting('meta_description', data.metaDescription.trim()),
    updateSetting('logo_url', data.logoUrl.trim()),
    updateSetting('og_image', data.ogImage.trim()),
  ]);
  revalidatePath('/settings');
  await revalidateStorefront();
}

export async function saveEmailCopy(data: {
  orderSubject: string; orderHeading: string; orderMessage: string; orderButton: string;
  updateSubject: string; updateHeading: string; updateMessage: string; updateButton: string;
}) {
  await assertCanSettings();
  const fields: Record<string, string> = {
    email_order_subject: data.orderSubject,
    email_order_heading: data.orderHeading,
    email_order_message: data.orderMessage,
    email_order_button: data.orderButton,
    email_update_subject: data.updateSubject,
    email_update_heading: data.updateHeading,
    email_update_message: data.updateMessage,
    email_update_button: data.updateButton,
  };
  await Promise.all(Object.entries(fields).map(([key, value]) => updateSetting(key, value.trim())));
  revalidatePath('/settings');
}

export async function sendEmailTemplateTest(data: {
  to: string;
  type: TestEmailTemplate;
  copy: EmailCopyDraft;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertCanSettings();
  try {
    await sendTestEmail({ to: data.to.trim(), type: data.type, copy: data.copy });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not send the test email.' };
  }
}

// Returns a plain result object instead of throwing on a rejected request (e.g. the API's
// 402 plan-gate response) — Next.js redacts a Server Action's thrown error message in
// production builds the same way it redacts a render error, so a thrown Error here would
// reach the client as generic "Server Components render" text with no way to recover the
// real message. Returning data instead sidesteps that redaction entirely.
// Same "return, don't throw" rule as savePaymentGateways below — a thrown message would be
// redacted by Next.js in production and the owner would lose the actual reason.
export async function testFonepay(data: {
  terminalId: string; username: string; password: string; privateKey: string;
}): Promise<FonepayTestResult | { ok: false; steps: { name: 'key'; ok: false; detail: string }[] }> {
  await assertCanSettings();
  try {
    return await testFonepayConnection({
      terminalId: data.terminalId || null, username: data.username || null,
      password: data.password || null, privateKey: data.privateKey || null,
    });
  } catch (err) {
    return { ok: false, steps: [{ name: 'key', ok: false,
      detail: err instanceof Error ? err.message : 'Could not reach the server to run the test.' }] };
  }
}

export async function testEsewa(data: { mode: string; productCode: string; secret: string }): Promise<ConnectionTestResult> {
  await assertCanSettings();
  try {
    return await testEsewaConnection({ mode: data.mode, productCode: data.productCode || null, secret: data.secret || null });
  } catch (err) {
    return { ok: false, steps: [{ name: 'server', ok: false, detail: err instanceof Error ? err.message : 'Could not reach eSewa to run the test.' }] };
  }
}

export async function testKhalti(data: { mode: string; secret: string }): Promise<ConnectionTestResult> {
  await assertCanSettings();
  try {
    return await testKhaltiConnection({ mode: data.mode, secret: data.secret || null });
  } catch (err) {
    return { ok: false, steps: [{ name: 'server', ok: false, detail: err instanceof Error ? err.message : 'Could not reach Khalti to run the test.' }] };
  }
}

export async function testNcm(data: { mode: 'test' | 'production'; fromBranch: string; token: string }): Promise<ConnectionTestResult> {
  await assertCanSettings();
  try {
    return await testNcmConnection({ mode: data.mode, fromBranch: data.fromBranch, token: data.token || null });
  } catch (err) {
    return { ok: false, steps: [{ name: 'server', ok: false, detail: err instanceof Error ? err.message : 'Could not reach NCM to run the test.' }] };
  }
}

export async function savePaymentGateways(data: {
  esewaEnabled: boolean; esewaMode: string; esewaProductCode: string; esewaSecret: string;
  khaltiEnabled: boolean; khaltiMode: string; khaltiSecret: string;
  fonepayEnabled: boolean; fonepayMode: string; fonepayTerminalId: string;
  fonepayUsername: string; fonepayPassword: string; fonepayPrivateKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertCanSettings();
  try {
    await updatePaymentGatewayConfig({
      esewaEnabled: data.esewaEnabled, esewaMode: data.esewaMode, esewaProductCode: data.esewaProductCode || null,
      esewaSecret: data.esewaSecret || null,
      khaltiEnabled: data.khaltiEnabled, khaltiMode: data.khaltiMode, khaltiSecret: data.khaltiSecret || null,
      fonepayEnabled: data.fonepayEnabled, fonepayMode: data.fonepayMode, fonepayTerminalId: data.fonepayTerminalId || null,
      fonepayUsername: data.fonepayUsername || null, fonepayPassword: data.fonepayPassword || null,
      fonepayPrivateKey: data.fonepayPrivateKey || null,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not save payment gateway settings.' };
  }
  revalidatePath('/settings');
  await revalidateStorefront();
  return { ok: true };
}

/**
 * Save NCM setup for the signed-in store. The store id always comes from the
 * authenticated session, never from form data, so a store admin cannot target
 * another tenant. A blank token keeps the encrypted token already on file.
 */
export async function saveCourierConfig(data: {
  ncmEnabled: boolean;
  ncmMode: 'test' | 'production';
  ncmFromBranch: string;
  ncmToken: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertCanSettings();
  try {
    const storeId = await currentStoreId();
    await updateStoreCourierConfig(storeId, {
      ncmEnabled: data.ncmEnabled,
      ncmMode: data.ncmMode,
      ncmFromBranch: data.ncmFromBranch.trim(),
      ncmToken: data.ncmToken.trim() || null,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not save courier settings.' };
  }
  revalidatePath('/settings/courier');
  return { ok: true };
}
