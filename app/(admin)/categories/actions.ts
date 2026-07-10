'use server';
import { createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Category, CategoryWrite } from '@/lib/api';
import { friendlyApiError } from '@/lib/errors';

async function assertCanEdit() {
  const me = await getAdmin();
  if (!me) throw new Error('Not authenticated');
}

export async function createCategoryAction(data: CategoryWrite): Promise<{ category?: Category; error?: string }> {
  try {
    await assertCanEdit();
    const category = await createCategory(data);
    revalidatePath('/categories');
    return { category };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to create category.') }; }
}

export async function updateCategoryAction(id: number, data: CategoryWrite): Promise<{ category?: Category; error?: string }> {
  try {
    await assertCanEdit();
    const category = await updateCategory(id, data);
    revalidatePath('/categories');
    return { category };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to save category.') }; }
}

export async function deleteCategoryAction(id: number): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    await deleteCategory(id);
    revalidatePath('/categories');
    return {};
  } catch (e) { return { error: friendlyApiError(e, 'Failed to delete category.') }; }
}
