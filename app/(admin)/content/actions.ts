'use server';
import { revalidatePath } from 'next/cache';
import { updateSetting } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';

async function assertCanSettings() {
  const me = await getAdmin();
  if (!can(me?.role, 'settings')) throw new Error('Forbidden');
}

export async function saveAboutContent(title: string, body: string): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    await Promise.all([
      updateSetting('about_title', title.trim()),
      updateSetting('about_body', body.trim()),
    ]);
    revalidatePath('/content');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save.' };
  }
  return {};
}

export async function saveCustomContent(title: string, body: string): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    await Promise.all([
      updateSetting('custom_title', title.trim()),
      updateSetting('custom_body', body.trim()),
    ]);
    revalidatePath('/content');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save.' };
  }
  return {};
}

export async function savePageVisibility(page: 'about' | 'gallery' | 'custom' | 'blog', enabled: boolean): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    await updateSetting(`${page}_enabled`, enabled ? 'true' : 'false');
    revalidatePath('/content');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save.' };
  }
  return {};
}
