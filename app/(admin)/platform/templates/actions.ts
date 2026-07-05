'use server';
import { revalidatePath } from 'next/cache';
import { getStore, updateStore, setTemplateAccess, setTemplateShowOnMarketing, updateTemplate, type TemplateUpdateInput } from '@/lib/api';
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
 * Toggle whether a template is showcased on the public marketing site (bikribazaar.com).
 * Independent of access — a template can be public (selectable by stores) but hidden from
 * the marketing showcase (e.g. still being polished), or vice versa.
 */
export async function setShowOnMarketingAction(
  id: string,
  showOnMarketing: boolean
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await setTemplateShowOnMarketing(id, showOnMarketing);
    revalidatePath('/platform/templates');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update marketing visibility' };
  }
}

/**
 * Update any subset of a template's catalog fields — name, tagline, description, palette,
 * demo URL, sort order, etc. There's no hardcoded template list on the backend anymore, so
 * this is the only way to change any of that content (previously only access/showOnMarketing
 * were DB-editable; everything else required a code deploy).
 */
export async function updateTemplateDetailsAction(
  id: string,
  fields: TemplateUpdateInput
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await updateTemplate(id, fields);
    revalidatePath('/platform/templates');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update template details' };
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
