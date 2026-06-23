'use server';
import { revalidatePath } from 'next/cache';
import { updateStore, updateSetting } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

async function assertCanSettings() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) throw new Error('Not allowed.');
}

/**
 * Poke the storefront's /api/revalidate endpoint so Next.js page-cache is
 * cleared immediately — without this, templateId is stale for up to 60s.
 * Fire-and-forget: a failure here is non-critical (cache expires on its own).
 */
async function revalidateStorefront(storeId: string): Promise<void> {
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN;
  const secret = process.env.REVALIDATE_SECRET;
  if (!domain || !secret) return;
  try {
    await fetch(`https://${storeId}.${domain}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
    });
  } catch {
    // Non-critical — cache will naturally expire within 60s.
  }
}

export async function setTemplateAction(templateId: string): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    const storeId = await currentStoreId();
    await updateStore(storeId, { templateId });
    void revalidateStorefront(storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update template.' };
  }
  revalidatePath('/design');
  return {};
}

export async function saveSectionsAction(sections: Array<{ id: string; enabled: boolean }>): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    const storeId = await currentStoreId();
    await updateSetting('home_sections', JSON.stringify(sections));
    void revalidateStorefront(storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save sections.' };
  }
  revalidatePath('/design');
  return {};
}
