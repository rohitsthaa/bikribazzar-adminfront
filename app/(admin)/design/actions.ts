'use server';
import { revalidatePath } from 'next/cache';
import { updateStore, updateSetting } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

async function assertCanSettings() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) throw new Error('Not allowed.');
}

export async function setTemplateAction(templateId: string): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    const storeId = await currentStoreId();
    await updateStore(storeId, { templateId });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update template.' };
  }
  revalidatePath('/design');
  return {};
}

export async function saveSectionsAction(sections: Array<{ id: string; enabled: boolean }>): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    await updateSetting('home_sections', JSON.stringify(sections));
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save sections.' };
  }
  revalidatePath('/design');
  return {};
}
