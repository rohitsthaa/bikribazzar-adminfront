'use server';
import { revalidatePath } from 'next/cache';
import { createMaterial, deleteMaterial } from '@/lib/api';

export async function addMaterial(_: unknown, formData: FormData) {
  const label = (formData.get('label') as string).trim();
  const sortOrder = Number(formData.get('sortOrder') ?? 0);
  if (!label) return { error: 'Label is required.' };
  try {
    await createMaterial({ label, sortOrder });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to add material.' };
  }
  revalidatePath('/materials');
}

export async function removeMaterial(id: number) {
  await deleteMaterial(id);
  revalidatePath('/materials');
}
