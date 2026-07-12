'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateOrderStatus, recordPayment, createAdminOrder, updateOrderNotes, updateOrderDelivery, getNcmBranches, shipOrderViaNcm, syncNcmStatus } from '@/lib/api';
import type { Order, CreateAdminOrderPayload } from '@/lib/api';

export async function updateStatusAction(orderId: string, status: Order['status'], deliveryFeeNpr?: number) {
  await updateOrderStatus(orderId, status, deliveryFeeNpr);
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

export async function saveDeliveryAction(
  orderId: string,
  data: {
    deliveryArea: string;
    address: string;
    landmark?: string;
    province?: string;
    district?: string;
    recipientName?: string;
    recipientPhone?: string;
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    await updateOrderDelivery(orderId, data);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save delivery' };
  }
}

export async function getNcmBranchesAction(): Promise<{ ok: true; branches: Awaited<ReturnType<typeof getNcmBranches>> } | { error: string }> {
  try {
    const branches = await getNcmBranches();
    return { ok: true, branches };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not load NCM branches' };
  }
}

export async function shipViaNcmAction(
  orderId: string,
  data: { toBranch: string; cod: boolean; instruction?: string }
): Promise<{ ok: true } | { error: string }> {
  try {
    await shipOrderViaNcm(Number(orderId), data);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to ship via NCM' };
  }
}

export async function syncNcmStatusAction(orderId: string): Promise<{ ok: true } | { error: string }> {
  try {
    await syncNcmStatus(Number(orderId));
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to sync NCM status' };
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
