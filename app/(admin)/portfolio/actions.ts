'use server';
import { createPortfolioWork, updatePortfolioWork, deletePortfolioWork } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { PortfolioWork } from '@/lib/api';
import { friendlyApiError } from '@/lib/errors';

async function assertCanEdit() {
  const me = await getAdmin();
  if (!me) throw new Error('Not authenticated');
}

export async function createWorkAction(data: Partial<PortfolioWork>): Promise<{ work?: PortfolioWork; error?: string }> {
  try {
    await assertCanEdit();
    const work = await createPortfolioWork(data);
    revalidatePath('/portfolio');
    return { work };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to create work.') }; }
}

export async function updateWorkAction(id: number, data: Partial<PortfolioWork>): Promise<{ work?: PortfolioWork; error?: string }> {
  try {
    await assertCanEdit();
    const work = await updatePortfolioWork(id, data);
    revalidatePath('/portfolio');
    return { work };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to save work.') }; }
}

export async function deleteWorkAction(id: number): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    await deletePortfolioWork(id);
    revalidatePath('/portfolio');
    return {};
  } catch (e) { return { error: friendlyApiError(e, 'Failed to delete work.') }; }
}
