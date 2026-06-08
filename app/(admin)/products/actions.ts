'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProduct, updateProduct, deleteProduct as apiDeleteProduct, restockProduct, adjustStock } from '@/lib/api';

export async function saveProduct(_: unknown, formData: FormData) {
  const id = (formData.get('id') as string).trim().toLowerCase().replace(/\s+/g, '-');
  const isNew = formData.get('_isNew') === '1';

  const stockQtyRaw = formData.get('stockQty') as string;
  const data = {
    id,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    priceNpr: Number(formData.get('priceNpr') ?? 0),
    category: formData.get('category') as string,
    details: (formData.get('details') as string) || null,
    tag: (formData.get('tag') as string) || null,
    image: (formData.get('image') as string) || '',
    available: formData.get('available') === 'true',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    prepaymentType: (formData.get('prepaymentType') as 'none' | 'percentage' | 'fixed') || 'none',
    prepaymentValue: Number(formData.get('prepaymentValue') ?? 0),
    stockQty: stockQtyRaw === '' || stockQtyRaw === null ? null : Number(stockQtyRaw),
    reorderPoint: Number(formData.get('reorderPoint') ?? 0),
  };

  try {
    if (isNew) {
      await createProduct(data);
    } else {
      await updateProduct(id, data);
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to save product.' };
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function toggleAvailability(id: string, available: boolean) {
  await updateProduct(id, { available });
  revalidatePath('/products');
}

export async function deleteProduct(id: string): Promise<{ error: string } | { ok: true }> {
  try {
    await apiDeleteProduct(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete product.' };
  }
  revalidatePath('/products');
  return { ok: true };
}

export async function restockAction(
  productId: string, qty: number, notes?: string
): Promise<{ error: string } | { ok: true }> {
  try {
    await restockProduct(productId, qty, notes);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to restock.' };
  }
  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  return { ok: true };
}

export async function adjustStockAction(
  productId: string, delta: number, notes?: string
): Promise<{ error: string } | { ok: true }> {
  try {
    await adjustStock(productId, delta, notes);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to adjust stock.' };
  }
  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  return { ok: true };
}
