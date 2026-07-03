'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProduct, bulkImportProducts, updateProduct, deleteProduct as apiDeleteProduct, restockProduct, adjustStock, restockVariant, adjustVariantStock } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';

// ── CSV import ────────────────────────────────────────────────────────────────

export type CsvRow = {
  id: string;
  name: string;
  description: string;
  priceNpr: number;
  category: string;
  details?: string;
  tag?: string;
  available: boolean;
  stockQty: number | null;
  reorderPoint: number;
};

export type ImportResult = {
  created: number;
  updated: number;
  errors: Array<{ row: number; id: string; error: string }>;
};

export async function importProductsCsv(rows: CsvRow[]): Promise<ImportResult> {
  const admin = await getAdmin();
  if (!admin) throw new Error('Unauthorized');

  const payload = rows.map((row, i) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    priceNpr: row.priceNpr,
    category: row.category,
    details: row.details || null,
    tag: row.tag || null,
    image: '',
    images: [] as string[],
    available: row.available,
    sortOrder: i,
    prepaymentType: 'none' as const,
    prepaymentValue: 0,
    stockQty: row.stockQty,
    reorderPoint: row.reorderPoint,
    digitalAssetUrl: null,
    isDigital: false,
    metaTitle: null,
    metaDescription: null,
  }));

  const { created, updated } = await bulkImportProducts(payload);
  revalidatePath('/products');
  return { created, updated, errors: [] };
}

export async function saveProduct(_: unknown, formData: FormData) {
  const id = (formData.get('id') as string).trim().toLowerCase().replace(/\s+/g, '-');
  const isNew = formData.get('_isNew') === '1';
  const role = (await getAdmin())?.role;
  const canPrice = can(role, 'setPrice'); // staff can't set/change price

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
    images: JSON.parse((formData.get('images') as string) || '[]') as string[],
    available: formData.get('available') === 'true',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    prepaymentType: (formData.get('prepaymentType') as 'none' | 'percentage' | 'fixed') || 'none',
    prepaymentValue: Number(formData.get('prepaymentValue') ?? 0),
    stockQty: stockQtyRaw === '' || stockQtyRaw === null ? null : Number(stockQtyRaw),
    reorderPoint: Number(formData.get('reorderPoint') ?? 0),
    digitalAssetUrl: (formData.get('digitalAssetUrl') as string) || null,
    isDigital: formData.get('isDigital') === 'true',
    metaTitle: (formData.get('metaTitle') as string) || null,
    metaDescription: (formData.get('metaDescription') as string) || null,
  };

  // Variants (optional). Parsed from the hidden JSON field. Staff can't set
  // prices, so strip per-variant price overrides for them.
  let variants: Array<{ id?: string; label: string; priceNpr: number | null; stockQty: number | null; sku: string | null; sortOrder: number }> | undefined;
  const variantsRaw = formData.get('variants') as string | null;
  if (variantsRaw != null) {
    try {
      const parsed = JSON.parse(variantsRaw) as typeof variants;
      variants = (parsed ?? []).map((v) => ({ ...v, priceNpr: canPrice ? v.priceNpr : null }));
    } catch { variants = undefined; }
  }

  try {
    if (isNew) {
      // Staff may create products, but price stays owner-controlled (defaults to
      // 0 = "price on request" until an owner sets it).
      if (!canPrice) data.priceNpr = 0;
      await createProduct({ ...data, ...(variants !== undefined ? { variants } : {}) });
    } else {
      // On edit, staff cannot change price: omit it so the API preserves the
      // existing value (PATCH is a partial update).
      const { priceNpr, ...rest } = data;
      const base = canPrice ? data : rest;
      await updateProduct(id, { ...base, ...(variants !== undefined ? { variants } : {}) });
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
    if (!can((await getAdmin())?.role, 'deleteProduct')) {
      return { error: 'You do not have permission to delete products.' };
    }
    await apiDeleteProduct(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete product.' };
  }
  revalidatePath('/products');
  return { ok: true };
}

export async function restockAction(
  productId: string, qty: number, notes?: string, batchDate?: string
): Promise<{ error: string } | { ok: true }> {
  try {
    await restockProduct(productId, qty, notes, batchDate);
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

export async function restockVariantAction(
  productId: string, variantId: string, qty: number, notes?: string, batchDate?: string
): Promise<{ error: string } | { ok: true }> {
  try {
    await restockVariant(productId, variantId, qty, notes, batchDate);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to restock variant.' };
  }
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function adjustVariantStockAction(
  productId: string, variantId: string, delta: number, notes?: string
): Promise<{ error: string } | { ok: true }> {
  try {
    await adjustVariantStock(productId, variantId, delta, notes);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to adjust variant stock.' };
  }
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}
