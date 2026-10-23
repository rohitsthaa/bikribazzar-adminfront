'use server';

import { revalidatePath } from 'next/cache';
import { updateSetting, revalidateStorefront, updatePaymentGatewayConfig, testFonepayConnection } from '@/lib/api';
import type { FonepayTestResult } from '@/lib/api';
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
  await revalidateStorefront();
}

// bankTransferEnabled gates whether "Bank transfer" shows as a checkout payment
// method on the storefront (CheckoutForm.tsx) — see that file's `availableMethods` filter.
// revalidateStorefront() below is what makes that show up immediately instead of
// after the storefront's ~5min settings cache TTL — see lib/api.ts for why.
export async function savePaymentQr(url: string, bankTransferEnabled: boolean) {
  await assertCanSettings();
  await Promise.all([
    updateSetting('payment_qr', url),
    updateSetting('payment_bank_transfer_enabled', bankTransferEnabled ? 'true' : 'false'),
  ]);
  revalidatePath('/settings');
  await revalidateStorefront();
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
  await revalidateStorefront();
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
