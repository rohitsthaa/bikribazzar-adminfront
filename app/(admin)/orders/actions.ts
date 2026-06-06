'use server';

import { revalidatePath } from 'next/cache';
import { updateOrderStatus } from '@/lib/api';
import type { Order } from '@/lib/api';

export async function updateStatusAction(orderId: string, status: Order['status']) {
  await updateOrderStatus(orderId, status);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
}
