'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createStore, updateStore, updateStorePaymentConfig, createStoreAdmin, deleteAdminUser } from '@/lib/api';
import { getAdmin } from '@/lib/auth';

function str(fd: FormData, key: string): string {
  return (fd.get(key)?.toString() ?? '').trim();
}

/** Guard: these platform actions are super-admin only. */
async function assertSuper() {
  const me = await getAdmin();
  if (me?.role !== 'super') throw new Error('Forbidden');
}

export async function createStoreAction(fd: FormData) {
  const id = str(fd, 'id').toLowerCase();
  const name = str(fd, 'name');
  const templateId = str(fd, 'templateId') || 'soulthread';
  if (!id || !name) return;
  await createStore({ id, name, templateId });
  revalidatePath('/platform');
  redirect(`/platform/${id}`);
}

export async function updateStoreAction(fd: FormData) {
  const id = str(fd, 'id');
  const theme = {
    colors: {
      primary: str(fd, 'primary') || undefined,
      accent: str(fd, 'accent') || undefined,
      bg: str(fd, 'bg') || undefined,
    },
    fonts: {
      display: str(fd, 'fontDisplay') || undefined,
      body: str(fd, 'fontBody') || undefined,
    },
  };
  await updateStore(id, {
    name: str(fd, 'name'),
    status: str(fd, 'status') || 'active',
    templateId: str(fd, 'templateId') || 'soulthread',
    customDomain: str(fd, 'customDomain') || null,
    theme,
  });
  revalidatePath(`/platform/${id}`);
}

export async function updatePaymentConfigAction(fd: FormData) {
  const id = str(fd, 'id');
  const data: Record<string, unknown> = {
    esewaEnabled: fd.get('esewaEnabled') === 'on',
    esewaMode: str(fd, 'esewaMode') || 'test',
    esewaProductCode: str(fd, 'esewaProductCode'),
    khaltiEnabled: fd.get('khaltiEnabled') === 'on',
    khaltiMode: str(fd, 'khaltiMode') || 'test',
  };
  // Only send a secret if the operator typed a new one (blank = leave unchanged).
  const esewaSecret = str(fd, 'esewaSecret');
  if (esewaSecret) data.esewaSecret = esewaSecret;
  const khaltiSecret = str(fd, 'khaltiSecret');
  if (khaltiSecret) data.khaltiSecret = khaltiSecret;

  await updateStorePaymentConfig(id, data);
  revalidatePath(`/platform/${id}`);
}

export async function createStoreAdminAction(
  storeId: string, email: string, password: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await createStoreAdmin({ storeId, email: email.trim().toLowerCase(), password });
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create admin' };
  }
}

export async function deleteStoreAdminAction(
  storeId: string, adminId: number
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertSuper();
    await deleteAdminUser(adminId);
    revalidatePath(`/platform/${storeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete admin' };
  }
}
