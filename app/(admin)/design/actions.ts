'use server';
import { revalidatePath } from 'next/cache';
import { getStore, updateStore, updateSetting } from '@/lib/api';
import { isFontFamilyName } from '@/lib/fonts';
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

export async function saveNavItemsAction(items: Array<{ label: string; href: string }>): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    const storeId = await currentStoreId();
    await updateSetting('nav_items', JSON.stringify(items));
    void revalidateStorefront(storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save navigation.' };
  }
  revalidatePath('/design');
  return {};
}

/**
 * Store font overrides (store.theme.fonts). Empty = the template's default. Also clears the
 * old Settings → "Font" value (`font_family`), which the storefront only uses as a body-font
 * fallback when theme.fonts.body is unset — once saved here, this is the one place for fonts.
 */
export async function saveFontsAction(fonts: { display: string; body: string }): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    const display = fonts.display.trim();
    const body = fonts.body.trim();
    for (const f of [display, body]) {
      if (f && !isFontFamilyName(f)) return { error: `"${f}" doesn't look like a Google Fonts family name.` };
    }
    const storeId = await currentStoreId();
    const store = await getStore(storeId);
    const theme = { ...(store.theme ?? {}) } as Record<string, unknown>;
    const nextFonts = { ...(display ? { display } : {}), ...(body ? { body } : {}) };
    if (Object.keys(nextFonts).length > 0) theme.fonts = nextFonts;
    else delete theme.fonts;
    await updateStore(storeId, { theme });
    await updateSetting('font_family', '');
    void revalidateStorefront(storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save fonts.' };
  }
  revalidatePath('/design');
  return {};
}

/**
 * Home-page highlights (`home_highlights`): the short selling points templates show in their
 * value strips, chips and marquees. Empty = the storefront's neutral defaults (delivery,
 * returns, questions).
 */
export async function saveHighlightsAction(items: Array<{ title: string; text: string }>): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    const clean = items
      .map((h) => ({ title: h.title.trim().slice(0, 40), text: h.text.trim().slice(0, 160) }))
      .filter((h) => h.title)
      .slice(0, 6);
    const storeId = await currentStoreId();
    await updateSetting('home_highlights', clean.length > 0 ? JSON.stringify(clean) : '');
    void revalidateStorefront(storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save highlights.' };
  }
  revalidatePath('/design');
  return {};
}
