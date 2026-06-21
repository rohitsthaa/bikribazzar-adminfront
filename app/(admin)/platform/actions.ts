'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createStore, updateStore, updateStorePaymentConfig } from '@/lib/api';

function str(fd: FormData, key: string): string {
  return (fd.get(key)?.toString() ?? '').trim();
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
