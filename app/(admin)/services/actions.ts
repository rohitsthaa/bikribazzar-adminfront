'use server';
import { createService, updateService, deleteService } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Service } from '@/lib/api';

async function assertCanEdit() {
  const me = await getAdmin();
  if (!me) throw new Error('Not authenticated');
}

export async function createServiceAction(data: Partial<Service>): Promise<{ service?: Service; error?: string }> {
  try {
    await assertCanEdit();
    const service = await createService(data);
    revalidatePath('/services');
    return { service };
  } catch (e) { return { error: String(e) }; }
}

export async function updateServiceAction(id: number, data: Partial<Service>): Promise<{ service?: Service; error?: string }> {
  try {
    await assertCanEdit();
    const service = await updateService(id, data);
    revalidatePath('/services');
    return { service };
  } catch (e) { return { error: String(e) }; }
}

export async function deleteServiceAction(id: number): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    await deleteService(id);
    revalidatePath('/services');
    return {};
  } catch (e) { return { error: String(e) }; }
}
