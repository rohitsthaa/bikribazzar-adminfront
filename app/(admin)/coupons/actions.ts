'use server';
import { revalidatePath } from 'next/cache';
import { createCoupon, updateCoupon, deleteCoupon } from '@/lib/api';

export async function addCoupon(_: unknown, formData: FormData) {
  const code = (formData.get('code') as string).trim().toUpperCase();
  const type = formData.get('type') as 'percentage' | 'fixed';
  const value = Number(formData.get('value'));
  const usesLeftRaw = formData.get('usesLeft') as string;
  const usesLeft = usesLeftRaw ? Number(usesLeftRaw) : null;
  const minOrderNpr = Number(formData.get('minOrderNpr') ?? 0);
  const expiresAtRaw = formData.get('expiresAt') as string;
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;

  if (!code || code.length < 2) return { error: 'Code must be at least 2 characters.' };
  if (!/^[A-Z0-9]+$/.test(code)) return { error: 'Code may only contain letters and digits.' };
  if (!value || value <= 0) return { error: 'Value must be a positive number.' };
  if (type === 'percentage' && value > 100) return { error: 'Percentage cannot exceed 100.' };

  try {
    await createCoupon({ code, type, value, usesLeft, minOrderNpr, expiresAt, active: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create coupon.';
    return { error: msg.includes('already exists') || msg.includes('duplicate') ? `Code "${code}" already exists.` : msg };
  }
  revalidatePath('/coupons');
}

export async function toggleCoupon(code: string, active: boolean) {
  await updateCoupon(code, { active });
  revalidatePath('/coupons');
}

export async function removeCoupon(code: string) {
  await deleteCoupon(code);
  revalidatePath('/coupons');
}
