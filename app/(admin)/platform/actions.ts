'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createStore, updateStore, updateStorePaymentConfig, createStoreAdmin, deleteAdminUser, getAllTemplates, deleteStore, restoreStore, permanentlyDeleteStore, getStoreDeletionImpact, createInvoice, patchInvoice, type StoreDeletionImpact } from '@/lib/api';
import { getAdmin } from '@/lib/auth';

function str(fd: FormData, key: string): string {
  return (fd.get(key)?.toString() ?? '').trim();
}

/** Guard: these platform actions are super-admin only. */
async function assertSuper() {
  const me = await getAdmin();
  if (me?.role !== 'super') throw new Error('Forbidden');
}

export async function createStoreAction(fd: FormData) {
  const id = str(fd, 'id').toLowerCase();
  const name = str(fd, 'name');
  const templateId = str(fd, 'templateId') || 'soulthread';
  const siteType = str(fd, 'siteType') || 'store';
  if (!id || !name) return;
  await createStore({ id, name, templateId, siteType });
  revalidatePath('/platform');
  redirect(`/platform/${id}`);
}

export async function updateStoreAction(fd: FormData) {
  await assertSuper();
  const id = str(fd, 'id');
  // Deliberately does NOT send theme/templateId — the Template & Theme section
  // (TemplateThemeClient, saved via updateStoreTemplateThemeAction) is the
  // sole owner of those fields. This form used to resend a snapshot of theme/
  // templateId frozen at page load on every save, which silently reverted
  // whatever was just changed in the Theme section if you saved General
  // afterwards without a full page reload in between. The API's PATCH only
  // touches fields actually present in the request, so omitting them here
  // leaves whatever's currently saved untouched — same fix as the product
  // stock-qty duplication.
  try {
    await updateStore(id, {
      name: str(fd, 'name'),
      status: str(fd, 'status') || 'active',
      customDomain: str(fd, 'customDomain') || null,
      isDemo: fd.get('isDemo') === 'on',
    });
  } catch (e: unknown) {
    // Re-throw Next.js internal errors (redirect / notFound)
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    const msg = e instanceof Error ? e.message : 'Save failed';
    redirect(`/platform/${id}?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath(`/platform/${id}`);
  redirect(`/platform/${id}?saved=1`);
}

/** Called programmatically from TemplateThemeClient — returns result for UI feedback. */
export async function updateStoreTemplateThemeAction(
  storeId: string,
  data: {
    name: string;
    status: string;
    customDomain: string | null;
    templateId: string;
    theme: Record<string, unknown>;
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await updateStore(storeId, {
      name: data.name,
      status: data.status,
      templateId: data.templateId,
      customDomain: data.customDomain,
      theme: data.theme,
    });
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save' };
  }
}

export async function updatePaymentConfigAction(fd: FormData) {
  await assertSuper();
  const id = str(fd, 'id');
  const data: Record<string, unknown> = {
    esewaEnabled: fd.get('esewaEnabled') === 'on',
    esewaMode: str(fd, 'esewaMode') || 'test',
    esewaProductCode: str(fd, 'esewaProductCode'),
    khaltiEnabled: fd.get('khaltiEnabled') === 'on',
    khaltiMode: str(fd, 'khaltiMode') || 'test',
  };
  const esewaSecret = str(fd, 'esewaSecret');
  if (esewaSecret) data.esewaSecret = esewaSecret;
  const khaltiSecret = str(fd, 'khaltiSecret');
  if (khaltiSecret) data.khaltiSecret = khaltiSecret;

  try {
    await updateStorePaymentConfig(id, data);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    const msg = e instanceof Error ? e.message : 'Save failed';
    redirect(`/platform/${id}?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath(`/platform/${id}`);
  redirect(`/platform/${id}?saved=1`);
}

export async function createStoreAdminAction(
  storeId: string, email: string, password: string, role: 'store' | 'staff' = 'store'
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await createStoreAdmin({ storeId, email: email.trim().toLowerCase(), password, role });
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create admin' };
  }
}

/**
 * Set a store's allowed template list.
 * allowedTemplates = null  → no restriction (all public templates)
 * allowedTemplates = [...] → restrict + grant private templates
 */
export async function updateAllowedTemplatesAction(
  storeId: string,
  allowedTemplates: string[] | null
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await updateStore(storeId, { allowedTemplates });
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update template access' };
  }
}

export async function deleteStoreAdminAction(
  storeId: string, adminId: number
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await deleteAdminUser(adminId);
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete admin' };
  }
}

/** Product/order counts for the delete-store confirmation warning. Never blocks deletion. */
export async function getStoreDeletionImpactAction(
  storeId: string
): Promise<StoreDeletionImpact | { error: string }> {
  try {
    await assertSuper();
    return await getStoreDeletionImpact(storeId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to check store data' };
  }
}

/**
 * Soft-deletes a store. Deliberately does not check for products/orders itself
 * — the confirmation UI (getStoreDeletionImpactAction) warns about those, but
 * this always proceeds once the admin confirms. Nothing is actually erased; see
 * restoreStoreAction to undo.
 *
 * The store's slug is renamed to an archived id so it's immediately reusable
 * by a new store — callers must redirect to `newId` (the config page at the
 * old id no longer exists).
 */
export async function deleteStoreAction(storeId: string): Promise<{ ok: true; newId: string } | { error: string }> {
  try {
    await assertSuper();
    const updated = await deleteStore(storeId);
    revalidatePath('/platform');
    revalidatePath('/platform/stores');
    revalidatePath(`/platform/${storeId}`);
    revalidatePath(`/platform/${updated.id}`);
    return { ok: true, newId: updated.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete store' };
  }
}

export async function restoreStoreAction(storeId: string): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await restoreStore(storeId);
    revalidatePath('/platform');
    revalidatePath('/platform/stores');
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to restore store' };
  }
}

/**
 * Irreversibly erases a store and all its data. Only allowed by the API once
 * the store is already soft-deleted (deleteStoreAction). There is no undo —
 * unlike deleteStoreAction, this does not return a new id to follow, because
 * there's no row left to look up. Callers must navigate away (e.g. to
 * /platform/stores) on success.
 */
export async function permanentlyDeleteStoreAction(storeId: string): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await permanentlyDeleteStore(storeId);
    revalidatePath('/platform');
    revalidatePath('/platform/stores');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to permanently delete store' };
  }
}

// ── Billing (see docs/SUBSCRIPTIONS_PLAN.md) ────────────────────────────────

/**
 * Direct super-admin override of a store's plan/subscription status — bypasses the
 * normal invoice-paid flow (PlanEndpoints.cs `PATCH /invoices/:id`). Useful for
 * comping a store, fixing a stuck status, or backfilling a plan without generating
 * a paper trail invoice. Does not touch nextBillingAt/trialEndsAt.
 */
export async function overrideStorePlanAction(
  storeId: string,
  plan: string,
  subscriptionStatus: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await updateStore(storeId, { plan, subscriptionStatus });
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to override plan' };
  }
}

/** Generate the next billing invoice for a store (manual billing — no autopay). */
export async function createInvoiceAction(
  storeId: string,
  data: { planId: string; periodStart: string; periodEnd: string; dueAt?: string; amountNpr?: number }
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await createInvoice(storeId, data);
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create invoice' };
  }
}

/** Mark an invoice paid (moves the store onto that plan) or void. */
export async function patchInvoiceAction(
  storeId: string,
  invoiceId: number,
  data: { status: 'paid' | 'void'; note?: string }
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await patchInvoice(invoiceId, data);
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update invoice' };
  }
}
