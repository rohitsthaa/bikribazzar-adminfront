'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProduct, bulkImportProducts, getAllProducts, updateProduct, deleteProduct as apiDeleteProduct, restockProduct, adjustStock, restockVariant, adjustVariantStock, deleteUploadedImage, getCategories, createCategory, revalidateStorefront, bulkProductAction, duplicateProduct, mergeProductsAsVariants, getProduct, type BulkProductAction } from '@/lib/api';
import { fieldsForVisibility, type Visibility } from '@/lib/visibility';
import { getAdmin, can } from '@/lib/auth';
import { friendlyApiError } from '@/lib/errors';
import type { ExistingProduct, ImportRow } from '@/lib/product-import';
import { categoryLookupKey } from '@/lib/product-import';

// ── CSV import ────────────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true; created: number; updated: number; categoriesCreated: number }
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
 * The importable fields of every product in the store, so the review grid can show which
 * rows overwrite something and exactly what each one would change.
 *
 * Only the ten columns a spreadsheet carries — not whole products. The admin's Product type
 * has thirty fields and the grid needs nine of them; sending the rest would be payload for
 * nothing.
 *
 * Called once when a file is parsed rather than on every Products page load: that page is
 * paginated now, so it only holds 50 products and cannot answer this itself. Returns [] on
 * failure, so the grid degrades to no badges rather than blocking the import.
 *
 * Follow-up worth having: the API has no "fields" parameter, so this still fetches whole
 * products server-side to throw most of each one away.
 */
export async function getExistingProductSummaries(): Promise<ExistingProduct[]> {
  const admin = await getAdmin();
  if (!admin) return [];
  try {
    const products = await getAllProducts();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceNpr: p.priceNpr,
      category: p.category ?? null,
      details: p.details,
      tag: p.tag,
      available: p.available,
      stockQty: p.stockQty,
      reorderPoint: p.reorderPoint,
    }));
  } catch {
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

  // CSV rows carry a free-text category key or label. Match either form against the
  // store's categories, then create each distinct missing category once before importing.
  let categories;
  try {
    categories = await getCategories();
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not load categories for this import.') };
  }
  const categoryIdByKey = new Map<string, number>();
  for (const category of categories) {
    const key = categoryLookupKey(category.key);
    const label = categoryLookupKey(category.label);
    if (key) categoryIdByKey.set(key, category.id);
    if (label) categoryIdByKey.set(label, category.id);
  }

  const missingCategories = new Map<string, string>();
  for (const row of rows) {
    const label = row.category.trim().replace(/\s+/g, ' ');
    const key = categoryLookupKey(label);
    if (label && !key) {
      return { ok: false, error: `Category "${label}" needs at least one letter or number.` };
    }
    if (key && !categoryIdByKey.has(key)) missingCategories.set(key, label);
  }
  if (missingCategories.size > 0 && !can(admin.role, 'settings')) {
    return { ok: false, error: 'Your role cannot create categories. Ask a store admin to add the categories, then import again.' };
  }

  let categoriesCreated = 0;
  let nextSortOrder = categories.reduce((max, category) => Math.max(max, category.sortOrder), -1) + 1;
  try {
    for (const [key, label] of missingCategories) {
      const category = await createCategory({ key, label, sortOrder: nextSortOrder++, parentId: null });
      categoryIdByKey.set(key, category.id);
      categoryIdByKey.set(categoryLookupKey(category.label), category.id);
      categoriesCreated++;
    }
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not create a category from the import. Check the category name and try again.') };
  }
  if (categoriesCreated > 0) revalidatePath('/categories');

  const payload = rows.map((row, i) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    priceNpr: row.priceNpr,
    categoryId: categoryIdByKey.get(categoryLookupKey(row.category)) ?? null,
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
    return { ok: true, created, updated, categoriesCreated };
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

  // One Visibility choice → the API's available + status pair (lib/visibility.ts).
  const visibilityRaw = formData.get('visibility') as Visibility | null;
  const vis = fieldsForVisibility(
    visibilityRaw && ['live', 'hidden', 'draft', 'archived'].includes(visibilityRaw) ? visibilityRaw : 'live',
  );

  // Price on request must be ticked on purpose; a bare 0 is a missing price, not a choice.
  const priceOnRequest = formData.get('priceOnRequest') === '1';
  if (canPrice && !priceOnRequest && !(Number(formData.get('priceNpr')) > 0)) {
    return { error: 'Enter a price, or tick "Price on request".' };
  }

  // Stock on edit: the count is owned by the Inventory panel, so it is never resent — doing
  // that is what used to happen by accident. With no stockQty field on the edit form,
  // parseOptionalNumberWithClearSentinel(null) returned -1, and the API reads -1 as "clear to
  // unlimited": EVERY save of an existing product silently switched its stock tracking off.
  // Only an explicit tracking toggle is sent now.
  const tracking = formData.get('stockTracking') as 'keep' | 'track' | 'untrack' | null;
  const stockQty = isNew
    ? parseOptionalNumberWithClearSentinel(formData.get('stockQty') as string, true)
    : tracking === 'untrack' ? -1 : tracking === 'track' ? 0 : undefined;

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
    available: vis.available,
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    prepaymentType: (formData.get('prepaymentType') as 'none' | 'percentage' | 'fixed') || 'none',
    prepaymentValue: Number(formData.get('prepaymentValue') ?? 0),
    ...(stockQty !== undefined ? { stockQty } : {}),
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
    status: vis.status,
    costNpr: parseOptionalNumberWithClearSentinel(formData.get('costNpr') as string, isNew),
    variantAxis: parseOptionalStringWithClearSentinel(formData.get('variantAxis') as string, isNew) as 'size' | 'color' | 'style' | null | undefined,
  };

  // Variants (optional). Parsed from the hidden JSON field. Staff can't set prices or costs,
  // so theirs come from the saved product — the API replaces the whole variant list, and
  // nulling them (as this used to) wiped every per-option price whenever staff saved.
  let variants: Array<{ id?: string; label: string; priceNpr: number | null; costNpr?: number | null; stockQty: number | null; sku: string | null; image?: string | null; sortOrder: number }> | undefined;
  const variantsRaw = formData.get('variants') as string | null;
  if (variantsRaw != null) {
    try {
      const parsed = (JSON.parse(variantsRaw) ?? []) as NonNullable<typeof variants>;
      if (canPrice) {
        variants = parsed;
      } else {
        const saved = isNew ? [] : ((await getProduct(id).catch(() => null))?.variants ?? []);
        const byId = new Map(saved.map((v) => [v.id, v]));
        variants = parsed.map((v) => {
          const prev = v.id ? byId.get(v.id) : undefined;
          return { ...v, priceNpr: prev?.priceNpr ?? null, costNpr: prev?.costNpr ?? null };
        });
      }
    } catch { variants = undefined; }
  }

  try {
    if (isNew) {
      // Staff may create products, but price stays owner-controlled (defaults to
      // 0 = "price on request" until an owner sets it).
      if (!canPrice) { data.priceNpr = 0; data.compareAtPriceNpr = null; data.costNpr = null; }
      await createProduct({ ...data, stockQty: stockQty ?? null, ...(variants !== undefined ? { variants } : {}) });
    } else {
      // On edit, staff cannot change price (or the sale price alongside it): omit
      // both so the API preserves the existing values (PATCH is a partial update).
      const { priceNpr, compareAtPriceNpr, costNpr, ...rest } = data;
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
  // "Live" means Available AND active — making a draft/archived product live has to move
  // its status too, or it would stay off the shop while the badge says Live.
  await updateProduct(id, available ? { available, status: 'active' } : { available });
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

// ── List-page tools (2026-10-22) ─────────────────────────────────────────────
// All return { error } rather than throwing — see the note on importProductsCsv.

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function bulkProductsAction(ids: string[], change: BulkProductAction): Promise<ActionResult<{ updated: number }>> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  if (change.action === 'price_percent' && !can(admin.role, 'setPrice')) {
    return { ok: false, error: 'Your role cannot change product pricing.' };
  }
  try {
    const { updated } = await bulkProductAction(ids, change);
    revalidatePath('/products');
    await revalidateStorefront();
    return { ok: true, updated };
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not update these products.') };
  }
}

export async function duplicateProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdmin())) return { ok: false, error: 'Unauthorized' };
  try {
    const res = await duplicateProduct(id);
    revalidatePath('/products');
    return { ok: true, id: res.id };
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not duplicate this product.') };
  }
}

export async function mergeAsVariantsAction(body: {
  id: string; name: string; variantAxis: 'size' | 'color' | 'style' | null;
  items: Array<{ productId: string; label: string }>;
}): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdmin())) return { ok: false, error: 'Unauthorized' };
  const id = body.id.trim().toLowerCase().replace(/\s+/g, '-');
  if (!id) return { ok: false, error: 'A URL slug is required.' };
  try {
    const res = await mergeProductsAsVariants({ ...body, id });
    revalidatePath('/products');
    await revalidateStorefront();
    return { ok: true, id: res.id };
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not combine these products.') };
  }
}

/**
 * Clears the placeholder products seeded at signup. Owners delete them; staff (who can't
 * delete) archive them instead. A sample that somehow ended up in an order can't be deleted
 * either — it is archived, which takes it off the shop just the same.
 */
export async function removeSampleProductsAction(ids: string[]): Promise<ActionResult<{ removed: number }>> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  const samples = ids.filter((id) => /-sample-\d+$/.test(id));
  if (samples.length === 0) return { ok: true, removed: 0 };

  const leftovers: string[] = [];
  if (can(admin.role, 'deleteProduct')) {
    const results = await Promise.allSettled(samples.map((id) => apiDeleteProduct(id)));
    results.forEach((r, i) => { if (r.status === 'rejected') leftovers.push(samples[i]); });
  } else {
    leftovers.push(...samples);
  }
  try {
    if (leftovers.length) await bulkProductAction(leftovers, { action: 'archive' });
  } catch (err) {
    return { ok: false, error: friendlyApiError(err, 'Could not remove the sample products.') };
  }
  revalidatePath('/products');
  await revalidateStorefront();
  return { ok: true, removed: samples.length };
}
