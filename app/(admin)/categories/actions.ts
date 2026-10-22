'use server';
import { createCategory, updateCategory, deleteCategory, sortCategories, revalidateStorefront } from '@/lib/api';
import { can, getAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Category, CategoryWrite } from '@/lib/api';
import { friendlyApiError } from '@/lib/errors';

async function assertCanEdit() {
  const me = await getAdmin();
  if (!me) throw new Error('Not authenticated');
  if (!can(me.role, 'settings')) throw new Error('Your role cannot change categories.');
}

// Every change also flushes the storefront cache. These used to refresh only this admin
// page, so a renamed or deleted category stayed in the shop menu for up to 5 minutes
// (the storefront's TTL on /categories).
async function refresh() {
  revalidatePath('/categories');
  revalidatePath('/products');
  await revalidateStorefront();
}

export async function createCategoryAction(data: CategoryWrite): Promise<{ category?: Category; error?: string }> {
  try {
    await assertCanEdit();
    const category = await createCategory(data);
    await refresh();
    return { category };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to create category.') }; }
}

export async function updateCategoryAction(id: number, data: CategoryWrite): Promise<{ category?: Category; error?: string }> {
  try {
    await assertCanEdit();
    const category = await updateCategory(id, data);
    await refresh();
    return { category };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to save category.') }; }
}

export async function reorderCategoriesAction(items: Array<{ id: number; sortOrder: number }>): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    await sortCategories(items);
    await refresh();
    return {};
  } catch (e) { return { error: friendlyApiError(e, 'Failed to reorder categories.') }; }
}

export async function deleteCategoryAction(id: number): Promise<{ error?: string; uncategorised?: number }> {
  try {
    await assertCanEdit();
    const res = await deleteCategory(id);
    await refresh();
    return { uncategorised: res.uncategorised };
  } catch (e) { return { error: friendlyApiError(e, 'Failed to delete category.') }; }
}
