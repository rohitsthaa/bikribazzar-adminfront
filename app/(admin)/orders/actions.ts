'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateOrderStatus, recordPayment, createAdminOrder, updateOrderNotes } from '@/lib/api';
import type { Order, CreateAdminOrderPayload } from '@/lib/api';

export async function updateStatusAction(orderId: string, status: Order['status']) {
  await updateOrderStatus(orderId, status);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
}

export async function recordPaymentAction(orderId: string, paidNpr: number): Promise<{ ok: true } | { error: string }> {
  try {
    await recordPayment(orderId, paidNpr);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to record payment' };
  }
}

export async function saveAdminNotesAction(
  orderId: string, adminNotes: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await updateOrderNotes(orderId, adminNotes);
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save notes' };
  }
}

export async function createAdminOrderAction(
  data: CreateAdminOrderPayload
): Promise<{ error: string } | void> {
  let orderId: number;
  try {
    const order = await createAdminOrder(data);
    orderId = order.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create order' };
  }
  revalidatePath('/orders');
  redirect(`/orders/${orderId}`);
}
