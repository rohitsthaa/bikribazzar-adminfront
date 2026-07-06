'use server';
import { revalidatePath } from 'next/cache';
import { createSelfServeInvoice, updateStore, type SubscriptionInvoiceView } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

async function assertCanSettings() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) throw new Error('Not allowed.');
}

/**
 * Store owner requests an upgrade to `planId`. Never accepts a storeId from the caller —
 * always the CALLER's own store via currentStoreId() (locked for 'store'/'staff' roles, see
 * lib/store-context.ts), so a store admin can never generate a billing invoice for a store
 * that isn't theirs. Idempotent server-side (PlanEndpoints.cs self-serve endpoint): calling
 * this again for the same plan just returns the existing pending invoice.
 */
export async function requestUpgradeAction(
  planId: string
): Promise<{ ok: true; invoice: SubscriptionInvoiceView } | { error: string }> {
  try {
    await assertCanSettings();
    const storeId = await currentStoreId();
    const invoice = await createSelfServeInvoice(storeId, planId);
    revalidatePath('/billing');
    return { ok: true, invoice };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to start upgrade' };
  }
}

/**
 * Free-plan switch with no payment involved (e.g. downgrading to Starter) — applies
 * immediately via direct override, same as the platform Billing override, but scoped to the
 * caller's own store only.
 */
export async function switchToFreePlanAction(
  planId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanSettings();
    const storeId = await currentStoreId();
    await updateStore(storeId, { plan: planId, subscriptionStatus: 'active' });
    revalidatePath('/billing');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to switch plan' };
  }
}
