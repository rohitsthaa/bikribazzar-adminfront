/**
 * Server-side only API client. Never imported from client components.
 * Attaches the internal token for write operations.
 */

import { currentStoreId } from './store-context';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': TOKEN,
      'x-store-id': await currentStoreId(),  // scope every admin call to the selected store
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---- Products ----

export type ProductVariant = {
  id?: string;
  label: string;
  priceNpr: number | null;   // null = inherit product price
  stockQty: number | null;   // null = unlimited
  sku: string | null;
  image?: string | null;     // e.g. a photo of this color — falls back to the product's main image
  sortOrder?: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  priceNpr: number;
  category: string;
  details: string | null;
  tag: string | null;
  image: string;
  images: string[];          // additional gallery images
  available: boolean;
  sortOrder: number;
  prepaymentType: 'none' | 'percentage' | 'fixed';
  prepaymentValue: number;
  stockQty: number | null;   // null = unlimited
  reorderPoint: number;
  digitalAssetUrl?: string | null;
  isDigital?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  widthCm?: number | null;
  heightCm?: number | null;
  depthCm?: number | null;
  leadTimeDays?: number | null;  // days before a made-to-order item ships; null = not applicable
  sku?: string | null;                  // product-level SKU; blank when variants carry their own
  compareAtPriceNpr?: number | null;    // "original" price shown struck through when set
  deliveryFeeNpr?: number | null;       // per-product delivery fee override; null = use store default, 0 = free
  tags?: string[];                      // multi-value tags for storefront filtering (separate from `tag` badge)
  status?: 'draft' | 'active' | 'archived';  // organizational label — independent of `available`
  variants?: ProductVariant[];
};

export type InventoryLog = {
  id: number;
  productId: string;
  variantId: string | null;
  delta: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'cancelled';
  notes: string | null;
  batchDate: string | null; // YYYY-MM-DD, set on restock entries
  orderId: number | null;
  createdAt: string;
};

export function getProducts() { return apiFetch<Product[]>('/products?all=1'); }
export function getProduct(id: string) { return apiFetch<Product>(`/products/${encodeURIComponent(id)}`); }

export function createProduct(data: Omit<Product, 'createdAt' | 'updatedAt'>) {
  return apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
}

export function bulkImportProducts(items: Array<Omit<Product, 'createdAt' | 'updatedAt'>>) {
  return apiFetch<{ created: number; updated: number }>('/products/bulk', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}

export function updateProduct(id: string, data: Partial<Product>) {
  return apiFetch<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string) {
  return apiFetch<{ ok: boolean }>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---- Uploaded files ----

/**
 * Deletes a previously-uploaded file from API storage, given the URL stored
 * on a product/variant (e.g. "http://api:3000/uploads/abc123.jpg" or
 * "/uploads/abc123.jpg"). Silently no-ops for anything that isn't one of our
 * own /uploads/ URLs (e.g. a manually pasted external image URL) — there's
 * nothing on our storage to clean up in that case.
 *
 * Callers should treat this as best-effort: a failed cleanup shouldn't fail
 * the product save that triggered it, since the save itself already
 * succeeded by the time this runs.
 */
export async function deleteUploadedImage(url: string): Promise<void> {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url; // already relative, e.g. "/uploads/abc123.jpg"
  }
  const match = pathname.match(/\/uploads\/([^/?#]+)/);
  if (!match) return; // not one of our upload URLs — nothing to delete

  try {
    await apiFetch(`/uploads/image/${encodeURIComponent(match[1])}`, { method: 'DELETE' });
  } catch (err) {
    console.error(`[deleteUploadedImage] Failed to delete ${match[1]}:`, err);
  }
}

export function getInventoryLog(productId: string) {
  return apiFetch<InventoryLog[]>(`/products/${encodeURIComponent(productId)}/inventory-logs`);
}

export function restockProduct(productId: string, qty: number, notes?: string, batchDate?: string) {
  return apiFetch<Product>(`/products/${encodeURIComponent(productId)}/restock`, {
    method: 'POST',
    body: JSON.stringify({ qty, notes, batchDate }),
  });
}

export function adjustStock(productId: string, delta: number, notes?: string) {
  return apiFetch<Product>(`/products/${encodeURIComponent(productId)}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ delta, notes }),
  });
}

export function restockVariant(productId: string, variantId: string, qty: number, notes?: string, batchDate?: string) {
  return apiFetch<ProductVariant>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/restock`,
    { method: 'POST', body: JSON.stringify({ qty, notes, batchDate }) },
  );
}

export function adjustVariantStock(productId: string, variantId: string, delta: number, notes?: string) {
  return apiFetch<ProductVariant>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/adjust`,
    { method: 'POST', body: JSON.stringify({ delta, notes }) },
  );
}

// ---- Testimonials ----

export type Testimonial = { id: number; quote: string; author: string; sortOrder: number };

export function getTestimonials() { return apiFetch<Testimonial[]>('/testimonials'); }
export function createTestimonial(data: { quote: string; author: string; sortOrder?: number }) {
  return apiFetch<Testimonial>('/testimonials', { method: 'POST', body: JSON.stringify(data) });
}
export function updateTestimonial(id: number, data: Partial<{ quote: string; author: string; sortOrder: number }>) {
  return apiFetch<Testimonial>(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function deleteTestimonial(id: number) {
  return apiFetch(`/testimonials/${id}`, { method: 'DELETE' });
}

// ---- Gallery ----

export type GalleryImage = { id: number; url: string; alt: string; sortOrder: number };

export function getGalleryImages() { return apiFetch<GalleryImage[]>('/gallery'); }
export function createGalleryImage(data: { url: string; alt?: string; sortOrder?: number }) {
  return apiFetch<GalleryImage>('/gallery', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteGalleryImage(id: number) {
  return apiFetch(`/gallery/${id}`, { method: 'DELETE' });
}

// ---- Orders ----

export type OrderSource = 'website' | 'tiktok' | 'instagram' | 'whatsapp' | 'phone' | 'walkin' | 'other';

export type Order = {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  address?: string;
  landmark?: string;
  province?: string;         // e.g. "Bagmati"
  district?: string;         // e.g. "Kathmandu"
  deliveryArea?: string;     // e.g. "Thamel", "Patan / Lalitpur"
  recipientName?: string;    // only set when shipping to someone other than the buyer
  recipientPhone?: string;
  notes?: string;
  adminNotes?: string;       // internal admin-only notes
  source: OrderSource;
  items: Array<{ productId: string; quantity: number; priceNpr: number; name?: string; variantId?: string; variantLabel?: string }>;
  totalNpr: number;
  advanceNpr: number;
  paidNpr: number;
  discountCode?: string;
  discountNpr: number;
  deliveryFeeNpr: number;
  isNationwide: boolean;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  statusLog: Array<{ status: string; at: string }>;
  paymentMethod?: string | null;          // null | 'esewa' — how recorded payment was taken
  payments?: Payment[];                    // all payment attempts (detail endpoint only)
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: number;
  orderId: number;
  provider: string;          // 'esewa'
  transactionUuid: string;
  amountNpr: number;
  status: 'initiated' | 'complete' | 'failed';
  refId: string | null;      // eSewa reference id once complete
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminOrderPayload = {
  customerName: string;
  email?: string;
  phone?: string;
  address?: string;
  deliveryArea?: string;
  notes?: string;
  source: OrderSource;
  items: Array<{ productId: string; quantity: number; priceNpr?: number }>;
};

export function createAdminOrder(data: CreateAdminOrderPayload) {
  return apiFetch<Order>('/orders/admin', { method: 'POST', body: JSON.stringify(data) });
}

// ---- Settings ----

export type SiteSettings = Record<string, string>;

export function getSettings() { return apiFetch<SiteSettings>('/settings'); }
export function updateSetting(key: string, value: string) {
  return apiFetch<{ key: string; value: string }>(`/settings/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });
}

// ---- Orders ----

// ---- Stores (platform) ----

export type StoreSummary = {
  id: string;
  name: string;
  status: string;
  templateId: string;
  theme: Record<string, unknown>;
  customDomain: string | null;
  // Server-driven — never sent in updateStore(). null when customDomain is
  // unset; otherwise "unverified" | "verifying" | "verified" | "active" | "failed".
  // See docs/CUSTOM_DOMAINS_PLAN.md.
  customDomainStatus: string | null;
  customDomainToken: string | null;
  siteType: string;
  allowedTemplates: string[] | null;
  deletedAt: string | null;
  previousId: string | null;  // slug this store had before it was deleted (rename cascade)
  isDemo: boolean;            // excluded from platform-wide analytics totals when true
};

export type StoreDeletionImpact = { productCount: number; orderCount: number };

export type StorePaymentConfigView = {
  usingDefaults: boolean; // true when the store has no saved override (inheriting platform defaults)
  esewaEnabled: boolean;
  esewaMode: 'test' | 'production';
  esewaProductCode: string;
  hasEsewaSecret: boolean;
  khaltiEnabled: boolean;
  khaltiMode: 'test' | 'production';
  hasKhaltiSecret: boolean;
};

export function getStores() { return apiFetch<StoreSummary[]>('/stores'); }
export function getStore(id: string) { return apiFetch<StoreSummary>(`/stores/${encodeURIComponent(id)}`); }
export function createStore(data: { id: string; name: string; templateId?: string; theme?: Record<string, unknown>; customDomain?: string | null; siteType?: string; isDemo?: boolean }) {
  return apiFetch<StoreSummary>('/stores', { method: 'POST', body: JSON.stringify(data) });
}
export function updateStore(id: string, data: Partial<{ name: string; status: string; templateId: string; theme: Record<string, unknown>; customDomain: string | null; siteType: string; allowedTemplates: string[] | null; isDemo: boolean }>) {
  return apiFetch<StoreSummary>(`/stores/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function getStorePaymentConfig(id: string) {
  return apiFetch<StorePaymentConfigView>(`/stores/${encodeURIComponent(id)}/payment-config`);
}
export function updateStorePaymentConfig(id: string, data: Record<string, unknown>) {
  return apiFetch<{ ok: boolean }>(`/stores/${encodeURIComponent(id)}/payment-config`, { method: 'PUT', body: JSON.stringify(data) });
}

/** How much data a store has (products/orders) — shown as a warning before deleting. Never blocks deletion. */
export function getStoreDeletionImpact(id: string) {
  return apiFetch<StoreDeletionImpact>(`/stores/${encodeURIComponent(id)}/deletion-impact`);
}

/**
 * Soft-deletes a store — hides it from lists/storefront but keeps all its
 * data. The store's `id` in the response is a NEW archived slug (the original
 * slug is freed for reuse immediately) — callers should redirect to it rather
 * than the id they called this with. Reversible via restoreStore(newId).
 */
export function deleteStore(id: string) {
  return apiFetch<StoreSummary>(`/stores/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Undoes a soft delete. Operates on the store's current (archived) id — it does not reclaim the original slug. */
export function restoreStore(id: string) {
  return apiFetch<StoreSummary>(`/stores/${encodeURIComponent(id)}/restore`, { method: 'POST' });
}

/**
 * Irreversibly erases a store and every row of its data (products, orders,
 * settings, admin accounts, etc.) — the "empty trash" step after deleteStore().
 * The API only allows this on a store that's already soft-deleted; call it with
 * the store's current (possibly archived) id. There is no undo past this call.
 */
export function permanentlyDeleteStore(id: string) {
  return apiFetch<{ ok: true; id: string; name: string; previousId: string | null }>(
    `/stores/${encodeURIComponent(id)}/permanent`,
    { method: 'DELETE' }
  );
}

// ---- Platform overview (super-admin) ----
export type PlatformOverview = {
  totals: { stores: number; active: number; suspended: number; deleted: number; orders: number; revenue: number };
  stores: Array<{
    id: string; name: string; status: string; templateId: string; deletedAt: string | null; isDemo: boolean;
    orderCount: number; revenue: number; pending: number;
    lastOrderAt: string | null; lowStock: number; hasPaymentConfig: boolean;
  }>;
  recent: Array<{ id: number; storeId: string; customerName: string; totalNpr: number; status: string; createdAt: string }>;
};

export function getPlatformOverview() {
  return apiFetch<PlatformOverview>('/stores/overview');
}

// ---- Admin users (super-admin manages store logins) ----
export type AdminUserView = {
  id: number;
  email: string;
  role: 'super' | 'store' | 'staff';
  storeId: string | null;
  emailVerified: boolean;
  createdAt: string;
};

/** All admin users across the platform (super-admin only). */
export function getAllAdminUsers() {
  return apiFetch<AdminUserView[]>('/admin-auth/users');
}
export function getStoreAdmins(storeId: string) {
  return apiFetch<AdminUserView[]>(`/admin-auth/users?storeId=${encodeURIComponent(storeId)}`);
}
export function createStoreAdmin(data: { email: string; password: string; storeId: string; role?: 'store' | 'staff' }) {
  return apiFetch<AdminUserView>('/admin-auth/users', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: data.role ?? 'store' }),
  });
}
export function patchAdminUser(id: number, data: { role?: string; storeId?: string | null; newPassword?: string }) {
  return apiFetch<AdminUserView>(`/admin-auth/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
export function resetAdminUserPassword(id: number, newPassword: string) {
  return apiFetch<AdminUserView>(`/admin-auth/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
  });
}
export function deleteAdminUser(id: number) {
  return apiFetch<{ ok: boolean }>(`/admin-auth/users/${id}`, { method: 'DELETE' });
}

export function getOrders() { return apiFetch<Order[]>('/orders'); }
export function getOrder(id: string) { return apiFetch<Order>(`/orders/${id}`); }
export function updateOrderStatus(id: string, status: Order['status'], deliveryFeeNpr?: number) {
  return apiFetch<Order>(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(deliveryFeeNpr !== undefined ? { status, deliveryFeeNpr } : { status }),
  });
}
export function recordPayment(id: string, paidNpr: number) {
  return apiFetch<Order>(`/orders/${id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paidNpr }),
  });
}

export function updateOrderNotes(id: string, adminNotes: string) {
  return apiFetch<Order>(`/orders/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNotes }),
  });
}

export function updateOrderDelivery(id: string, data: {
  deliveryArea?: string;
  address?: string;
  landmark?: string;
  province?: string;
  district?: string;
  recipientName?: string;
  recipientPhone?: string;
}) {
  return apiFetch<Order>(`/orders/${id}/delivery`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ---- Coupons ----

export type Coupon = {
  code: string;          // uppercase
  type: 'percentage' | 'fixed';
  value: number;         // percent (1-100) or NPR amount
  usesLeft: number | null;  // null = unlimited
  minOrderNpr: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export function getCoupons() { return apiFetch<Coupon[]>('/coupons'); }

export function createCoupon(data: Omit<Coupon, 'createdAt'>) {
  return apiFetch<Coupon>('/coupons', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCoupon(code: string, data: Partial<Omit<Coupon, 'code' | 'createdAt'>>) {
  return apiFetch<Coupon>(`/coupons/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteCoupon(code: string) {
  return apiFetch<{ ok: boolean }>(`/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

// --- reviews ---

export type Review = {
  id: number;
  storeId: string;
  productId: string;
  reviewerName: string;
  rating: number;
  body: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

// ---- Templates ----

/**
 * A template is fully DB-driven now (template_configs table) — every field here is
 * admin-editable via PATCH /templates/:id, not just access/showOnMarketing. There is no
 * hardcoded catalog on the backend anymore.
 */
export type TemplateMeta = {
  id: string;
  access?: 'public' | 'private';
  name: string;
  tagline: string;
  description: string;
  palette: string[];
  paletteLabels: string[];
  siteTypes?: string[];
  isPremium?: boolean;
  /** Whether this template is showcased on the public marketing site (bikribazaar.com). */
  showOnMarketing?: boolean;
  /** Live demo storefront the marketing site links to for this template. */
  demoUrl?: string;
  /** Preview screenshot shown on the marketing site's template showcase card. Empty/undefined = falls back to the CSS mockup preview. */
  imageUrl?: string;
  /** Display order in template pickers/listings (ascending). */
  sortOrder?: number;
};

export type TemplateUpdateInput = Partial<{
  name: string;
  tagline: string;
  description: string;
  palette: string[];
  paletteLabels: string[];
  siteTypes: string[];
  access: 'public' | 'private';
  isPremium: boolean;
  showOnMarketing: boolean;
  demoUrl: string;
  imageUrl: string;
  sortOrder: number;
}>;

/** Returns store-scoped templates (filtered by x-store-id). */
export function getTemplates() { return apiFetch<TemplateMeta[]>('/templates'); }

/** Returns ALL templates including private ones. Internal-token only. Super-admin use. */
export function getAllTemplates() { return apiFetch<TemplateMeta[]>('/templates/all'); }

/** Partial update of any template field. Internal-token only. */
export function updateTemplate(id: string, fields: TemplateUpdateInput) {
  return apiFetch<TemplateMeta>(`/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

/** Set a template's access level (public | private). Internal-token only. */
export function setTemplateAccess(id: string, access: 'public' | 'private') {
  return updateTemplate(id, { access });
}

/** Toggle whether a template is showcased on the public marketing site. Internal-token only. */
export function setTemplateShowOnMarketing(id: string, showOnMarketing: boolean) {
  return updateTemplate(id, { showOnMarketing });
}

export function getReviews(status?: 'pending' | 'approved' | 'rejected' | 'all') {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<Review[]>(`/reviews${qs}`);
}

export function updateReviewStatus(id: number, status: 'approved' | 'rejected' | 'pending') {
  return apiFetch<Review>(`/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ---- Leads / Enquiries ----

export type Lead = {
  id: number;
  storeId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  readAt: string | null;
  createdAt: string;
};

export async function getLeads(): Promise<Lead[]> {
  const r = await apiFetch<Lead[] | { items: Lead[] }>('/leads');
  return Array.isArray(r) ? r : (r as { items: Lead[] }).items ?? [];
}
export function markLeadRead(id: number) {
  return apiFetch<Lead>(`/leads/${id}/read`, { method: 'PATCH', body: '{}' });
}

// ---- Blog ----

export type BlogPost = {
  id: number;
  storeId: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  coverImage: string;
  status: 'draft' | 'published';
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getBlogPosts(): Promise<BlogPost[]> {
  const r = await apiFetch<BlogPost[] | { items: BlogPost[] }>('/blog/posts');
  return Array.isArray(r) ? r : (r as { items: BlogPost[] }).items ?? [];
}
export function getBlogPost(id: number) { return apiFetch<BlogPost>(`/blog/posts/${id}`); }
export function createBlogPost(data: Partial<BlogPost>) {
  return apiFetch<BlogPost>('/blog/posts', { method: 'POST', body: JSON.stringify(data) });
}
export function updateBlogPost(id: number, data: Partial<BlogPost>) {
  return apiFetch<BlogPost>(`/blog/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function deleteBlogPost(id: number) {
  return apiFetch<{ ok: boolean }>(`/blog/posts/${id}`, { method: 'DELETE', body: '{}' });
}

// ---- Portfolio ----

export type PortfolioWork = {
  id: number;
  storeId: string;
  title: string;
  slug: string;
  medium: string;
  year: string;
  description: string;
  images: string[];
  tags: string[];
  priceLabel: string;
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function getPortfolioWorks() { return apiFetch<PortfolioWork[]>('/portfolio/works'); }
export function createPortfolioWork(data: Partial<PortfolioWork>) {
  return apiFetch<PortfolioWork>('/portfolio/works', { method: 'POST', body: JSON.stringify(data) });
}
export function updatePortfolioWork(id: number, data: Partial<PortfolioWork>) {
  return apiFetch<PortfolioWork>(`/portfolio/works/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function deletePortfolioWork(id: number) {
  return apiFetch<{ ok: boolean }>(`/portfolio/works/${id}`, { method: 'DELETE', body: '{}' });
}

// ---- Services ----

export type Service = {
  id: number;
  storeId: string;
  title: string;
  description: string;
  priceLabel: string;
  image: string;
  tags: string[];
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function getServices() { return apiFetch<Service[]>('/services'); }
export function createService(data: Partial<Service>) {
  return apiFetch<Service>('/services', { method: 'POST', body: JSON.stringify(data) });
}
export function updateService(id: number, data: Partial<Service>) {
  return apiFetch<Service>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function deleteService(id: number) {
  return apiFetch<{ ok: boolean }>(`/services/${id}`, { method: 'DELETE', body: '{}' });
}
