'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProduct, bulkImportProducts, getAllProducts, updateProduct, deleteProduct as apiDeleteProduct, restockProduct, adjustStock, restockVariant, adjustVariantStock, deleteUploadedImage, getCategories, revalidateStorefront } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { friendlyApiError } from '@/lib/errors';
import type { ImportRow } from '@/lib/product-import';

// ── CSV import ────────────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true; created: number; updated: number }
  | { ok: false; error: string };

/**
 * The columns a spreadsheet actually carries, as JSON property names the API understands.
 *
 * Sent as `suppliedFields` so the API only writes these on an update. Without it, the row
 * below — which has to send *something* for every field — wiped the merchant's product
 * photos, SKU, sale price, dimensions, delivery-fee override and SEO on every re-import,
 * and reset archived products to active.
 *
 * sortOrder is deliberately absent: it is the row index, so including it would reshuffle
 * the whole catalogue into file order every time someone updated a price.
 */
const SUPPLIED_FIELDS = [
  'name', 'description', 'priceNpr', 'categoryId',
  'details', 'tag', 'available', 'stockQty', 'reorderPoint',
];

/**
 * Returns rather than throws, matching the convention documented in settings/actions.ts:
 * Next.js redacts a thrown Server Action message in production, so the API's genuinely
 * useful 402 ("Your Starter plan allows up to 50 products — upgrade or trim the file")
 * reached the user as a blank error page via the route boundary.
 */
/**
 * Ids of every product in the store, so the review grid can tell the merchant which rows
 * will be added and which will overwrite something that already exists.
 *
 * Called once when a file is parsed rather than on every Products page load — the page is
 * paginated now, so it only holds 50 products and can't answer this itself. The full
 * product objects never cross to the browser; only this string array does.
 *
 * Follow-up worth having: the API has no "ids only" mode, so this fetches whole products
 * server-side to throw nearly all of it away.
 */
export async function getExistingProductIds(): Promise<string[]> {
  const admin = await getAdmin();
  if (!admin) return [];
  try {
    const products = await getAllProducts();
    return products.map((p) => p.id);
  } catch {
    // Not fatal: the grid just shows no badges rather than blocking the import.
    return [];
  }
}

export async function importProductsCsv(rows: ImportRow[]): Promise<ImportResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  // Import sets prices, so it needs the same permission the product form gates pricing
  // behind — otherwise it is a way for staff to change prices they cannot change directly.
  if (!can(admin.role, 'setPrice')) {
    return { ok: false, error: 'Your role cannot change product pricing.' };
  }

  // The client is not a trust boundary, and the API rejects the whole batch for a blank id.
  const blank = rows.findIndex((r) => !r.id?.trim());
  if (blank !== -1) return { ok: false, error: `Row ${blank + 1} has no id.` };

  // CSV rows carry a free-text category key (matches what a merchant would export/
  // edit by hand); resolve it against the store's real categories. No match (or
  // blank) -> uncategorized, rather than silently inventing a category row.
  const categories = await getCategories().catch(() => []);
  const categoryIdByKey = new Map(categories.map((c) => [c.key.toLowerCase(), c.id]));

  const payload = rows.map((row, i) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    priceNpr: row.priceNpr,
    categoryId: categoryIdByKey.get(row.category.toLowerCase()) ?? null,
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
    suppliedFields: SUPPLIED_FIELDS,
  }));

  try {
    const { created, updated } = await bulkImportProducts(payload);
    revalidatePath('/products');
    await revalidateStorefront();
    return { ok: true, created, updated };
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not import these products.') };
  }
}

// Shared -1-sentinel-on-edit pattern: on create, a blank field is unambiguous
// (just null). On edit, PATCH is a partial update, so plain `null` is
// indistinguishable from "field not sent" once it reaches the API — blanking
// the field needs to send -1 instead so the API's PATCH handler knows to
// actually clear it. Used for every optional numeric product field where
// "clear it back to unset" is a real, expected admin action (sale price,
// delivery fee override, dimensions, lead time, stock qty going back to
// "unlimited") — negative values are never legitimate for any of these, so
// -1 is safe to reserve as the sentinel.
function parseOptionalNumberWithClearSentinel(raw: string | null, isNew: boolean): number | null {
  if (raw == null || raw.trim() === '') return isNew ? null : -1;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Same ambiguity, string-field version: on create, blank is unambiguous (null =
// not set). On edit, the API's `!= null` PATCH guard treats a JSON `null` as
// "field omitted, leave untouched" — so blanking a string field on edit must
// send an explicit "" instead, which the API reads as "clear this field" (see
// details/tag/digitalAssetUrl/metaTitle/metaDescription/sku handling in
// ProductEndpoints.cs). Previously every one of these sent `null` on blank
// regardless of create vs. edit, so blanking them on an existing product
// silently did nothing.
function parseOptionalStringWithClearSentinel(raw: string | null, isNew: boolean): string | null {
  if (raw == null || raw.trim() === '') return isNew ? null : '';
  return raw;
}

// CompareAtPriceNpr uses a -1 sentinel on edit so "end the sale" (blanking the
// field) actually clears it via PATCH — see PatchProductRequest in the API.
// On create there's no ambiguity to resolve, so blank is just null.
function parseCompareAtPrice(raw: string | null, isNew: boolean): number | null {
  return parseOptionalNumberWithClearSentinel(raw, isNew);
}

// Same -1-sentinel-on-edit pattern as parseCompareAtPrice — blanking the field
// means "go back to the store default fee", which needs to actually clear the
// per-product override via PATCH, not just leave it untouched.
function parseDeliveryFeeOverride(raw: string | null, isNew: boolean): number | null {
  return parseOptionalNumberWithClearSentinel(raw, isNew);
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

  const data = {
    id,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    priceNpr: Number(formData.get('priceNpr') ?? 0),
    categoryId: formData.get('categoryId') ? Number(formData.get('categoryId')) : null,
    details: parseOptionalStringWithClearSentinel(formData.get('details') as string, isNew),
    tag: parseOptionalStringWithClearSentinel(formData.get('tag') as string, isNew),
    image: (formData.get('image') as string) || '',
    images: JSON.parse((formData.get('images') as string) || '[]') as string[],
    available: formData.get('available') === 'true',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    prepaymentType: (formData.get('prepaymentType') as 'none' | 'percentage' | 'fixed') || 'none',
    prepaymentValue: Number(formData.get('prepaymentValue') ?? 0),
    stockQty: parseOptionalNumberWithClearSentinel(formData.get('stockQty') as string, isNew),
    reorderPoint: Number(formData.get('reorderPoint') ?? 0),
    digitalAssetUrl: parseOptionalStringWithClearSentinel(formData.get('digitalAssetUrl') as string, isNew),
    isDigital: formData.get('isDigital') === 'true',
    metaTitle: parseOptionalStringWithClearSentinel(formData.get('metaTitle') as string, isNew),
    metaDescription: parseOptionalStringWithClearSentinel(formData.get('metaDescription') as string, isNew),
    widthCm: parseOptionalNumberWithClearSentinel(formData.get('widthCm') as string, isNew),
    heightCm: parseOptionalNumberWithClearSentinel(formData.get('heightCm') as string, isNew),
    depthCm: parseOptionalNumberWithClearSentinel(formData.get('depthCm') as string, isNew),
    leadTimeDays: parseOptionalNumberWithClearSentinel(formData.get('leadTimeDays') as string, isNew),
    sku: parseOptionalStringWithClearSentinel(formData.get('sku') as string, isNew),
    compareAtPriceNpr: parseCompareAtPrice(formData.get('compareAtPriceNpr') as string, isNew),
    deliveryFee: parseDeliveryFeeOverride(formData.get('deliveryFee') as string, isNew),
    tags: parseTags(formData.get('tags') as string),
    status: (formData.get('status') as 'draft' | 'active' | 'archived') || 'active',
    variantAxis: parseOptionalStringWithClearSentinel(formData.get('variantAxis') as string, isNew) as 'size' | 'color' | 'style' | null | undefined,
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
  // Must run before redirect() — code after redirect() never executes (it
  // throws a Next.js control-flow signal).
  await revalidateStorefront();
  redirect('/products');
}

export async function toggleAvailability(id: string, available: boolean) {
  await updateProduct(id, { available });
  revalidatePath('/products');
  await revalidateStorefront();
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
  await revalidateStorefront();
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
  await revalidateStorefront();
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
  await revalidateStorefront();
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
  await revalidateStorefront();
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
  await revalidateStorefront();
  return { ok: true };
}
