'use server';

import { revalidatePath } from 'next/cache';
import { patchAdminUser, deleteAdminUser, createStoreAdmin } from '@/lib/api';
import { getAdmin } from '@/lib/auth';

async function assertSuper() {
  const me = await getAdmin();
  if (me?.role !== 'super') throw new Error('Forbidden');
}

export async function patchAdminUserAction(
  id: number,
  role: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await patchAdminUser(id, { role });
    revalidatePath('/platform/users');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update role' };
  }
}

export async function updateAdminUserEmailAction(
  id: number,
  email: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { error: 'Email cannot be blank.' };
    await patchAdminUser(id, { email: trimmed });
    revalidatePath('/platform/users');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update email' };
  }
}

export async function deleteAdminUserAction(
  id: number,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await deleteAdminUser(id);
    revalidatePath('/platform/users');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete user' };
  }
}

export async function createPlatformAdminAction(
  email: string,
  password: string,
  role: 'store' | 'staff',
  storeId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await createStoreAdmin({ email: email.trim().toLowerCase(), password, storeId, role });
    revalidatePath('/platform/users');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create user' };
  }
}
