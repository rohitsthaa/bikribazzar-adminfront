'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProduct, bulkImportProducts, updateProduct, deleteProduct as apiDeleteProduct, restockProduct, adjustStock, restockVariant, adjustVariantStock, deleteUploadedImage } from '@/lib/api';
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

// Blank field → null (not specified). Same "blank on edit doesn't clear" limitation
// as stockQty/tag below — a blank value is indistinguishable from "not provided"
// once it reaches the API's PATCH handler.
function parseOptionalNumber(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// CompareAtPriceNpr uses a -1 sentinel on edit so "end the sale" (blanking the
// field) actually clears it via PATCH — see PatchProductRequest in the API.
// On create there's no ambiguity to resolve, so blank is just null.
function parseCompareAtPrice(raw: string | null, isNew: boolean): number | null {
  if (raw == null || raw.trim() === '') return isNew ? null : -1;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseTags(raw: string | null): string[] {
  if (raw == null) return [];
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

function parseJsonStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string' && v.length > 0) : [];
  } catch {
    return [];
  }
}

// After a successful edit-save, delete any previously-uploaded image files
// that are no longer referenced by this product (main image, gallery, or
// variant photos) — e.g. the user replaced or removed a photo. Best-effort:
// failures are logged but never surface to the user or fail the save, since
// the save itself already succeeded by the time this runs. Never called on
// create (isNew) since there's no "previous" state to clean up.
async function cleanupOrphanedImages(formData: FormData, next: { image: string; images: string[] }, nextVariantImages: string[]) {
  const prevImage = (formData.get('_prevImage') as string) || '';
  const prevImages = parseJsonStringArray(formData.get('_prevImages') as string | null);
  const prevVariantImages = parseJsonStringArray(formData.get('_prevVariantImages') as string | null);

  const stillUsed = new Set([next.image, ...next.images, ...nextVariantImages].filter(Boolean));
  const orphaned = Array.from(new Set([prevImage, ...prevImages, ...prevVariantImages])).filter(
    (url) => url && !stillUsed.has(url),
  );
  if (orphaned.length === 0) return;

  await Promise.allSettled(orphaned.map((url) => deleteUploadedImage(url)));
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
    widthCm: parseOptionalNumber(formData.get('widthCm') as string),
    heightCm: parseOptionalNumber(formData.get('heightCm') as string),
    depthCm: parseOptionalNumber(formData.get('depthCm') as string),
    leadTimeDays: parseOptionalNumber(formData.get('leadTimeDays') as string),
    sku: (formData.get('sku') as string) || null,
    compareAtPriceNpr: parseCompareAtPrice(formData.get('compareAtPriceNpr') as string, isNew),
    tags: parseTags(formData.get('tags') as string),
    status: (formData.get('status') as 'draft' | 'active' | 'archived') || 'active',
  };

  // Variants (optional). Parsed from the hidden JSON field. Staff can't set
  // prices, so strip per-variant price overrides for them.
  let variants: Array<{ id?: string; label: string; priceNpr: number | null; stockQty: number | null; sku: string | null; image?: string | null; sortOrder: number }> | undefined;
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
      if (!canPrice) { data.priceNpr = 0; data.compareAtPriceNpr = null; }
      await createProduct({ ...data, ...(variants !== undefined ? { variants } : {}) });
    } else {
      // On edit, staff cannot change price (or the sale price alongside it): omit
      // both so the API preserves the existing values (PATCH is a partial update).
      const { priceNpr, compareAtPriceNpr, ...rest } = data;
      const base = canPrice ? data : rest;
      await updateProduct(id, { ...base, ...(variants !== undefined ? { variants } : {}) });

      // Best-effort cleanup of any images this edit replaced/removed. Only
      // meaningful once we know which variant images are still in use — if
      // the variants field failed to parse, skip variant-image cleanup
      // entirely rather than risk deleting one that's still referenced.
      const nextVariantImages = variants === undefined
        ? parseJsonStringArray(formData.get('_prevVariantImages') as string | null)
        : variants.map((v) => v.image).filter((img): img is string => !!img);
      await cleanupOrphanedImages(formData, { image: data.image, images: data.images }, nextVariantImages);
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
