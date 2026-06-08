'use server';

import { revalidatePath } from 'next/cache';
import { updateOrderStatus, recordPayment } from '@/lib/api';
import type { Order } from '@/lib/api';

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
