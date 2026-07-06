'use server';
import { revalidatePath } from 'next/cache';
import { updatePlanConfig, type PlanConfigUpdateInput } from '@/lib/api';
import { getAdmin } from '@/lib/auth';

async function assertSuper() {
  const me = await getAdmin();
  if (me?.role !== 'super') throw new Error('Forbidden');
}

/**
 * Update any subset of a plan's fields (pricing, limits, feature flags, active state).
 * There's no create endpoint — new tiers are added via migration
 * (see 20260707100300_SeedPlanCatalog) — this only edits what's already seeded.
 */
export async function updatePlanAction(
  id: string,
  fields: PlanConfigUpdateInput
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await updatePlanConfig(id, fields);
    revalidatePath('/platform/plans');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update plan' };
  }
}
