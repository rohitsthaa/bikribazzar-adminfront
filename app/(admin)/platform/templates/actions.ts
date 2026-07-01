'use server';
import { revalidatePath } from 'next/cache';
import { getStore, updateStore, setTemplateAccess } from '@/lib/api';
import { getAdmin } from '@/lib/auth';

async function assertSuper() {
  const me = await getAdmin();
  if (me?.role !== 'super') throw new Error('Forbidden');
}

/**
 * Toggle a template between public and private (exclusive).
 * Stored in the template_configs DB table — takes precedence over the hardcoded default.
 */
export async function setTemplateAccessAction(
  id: string,
  access: 'public' | 'private'
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await setTemplateAccess(id, access);
    revalidatePath('/platform/templates');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update access' };
  }
}

/**
 * Grant a private template to a store.
 * If the store is unrestricted (allowedTemplates = null), converts to an
 * explicit list: all current public template IDs + the private one being granted.
 * This is necessary because null means "all public only" — private templates
 * must be explicitly listed.
 */
export async function grantTemplateAccessAction(
  storeId: string,
  templateId: string,
  allPublicIds: string[]
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    const store = await getStore(storeId);
    const current = store.allowedTemplates ?? null;
    let next: string[];
    if (current === null) {
      next = [...allPublicIds, templateId];
    } else if (!current.includes(templateId)) {
      next = [...current, templateId];
    } else {
      return { ok: true }; // already granted
    }
    await updateStore(storeId, { allowedTemplates: next });
    revalidatePath('/platform/templates');
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to grant access' };
  }
}

/**
 * Revoke a private template from a store.
 * Removes from allowedTemplates array. If the remaining list has no private
 * templates and matches only public templates, leaves it as-is (don't auto-reset
 * to null, since the store may intentionally restrict public templates too).
 */
export async function revokeTemplateAccessAction(
  storeId: string,
  templateId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    const store = await getStore(storeId);
    const current = store.allowedTemplates;
    if (!current || !current.includes(templateId)) return { ok: true };
    const next = current.filter((id) => id !== templateId);
    await updateStore(storeId, { allowedTemplates: next.length === 0 ? null : next });
    revalidatePath('/platform/templates');
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to revoke access' };
  }
}
