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

export function updateProduct(id: string, data: Partial<Product>) {
  return apiFetch<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string) {
  return apiFetch<{ ok: boolean }>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getInventoryLog(productId: string) {
  return apiFetch<InventoryLog[]>(`/products/${encodeURIComponent(productId)}/inventory-log`);
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
  deliveryArea?: string;     // e.g. "Thamel", "Patan / Lalitpur"
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
  siteType: string;
};

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
export function createStore(data: { id: string; name: string; templateId?: string; theme?: Record<string, unknown>; customDomain?: string | null; siteType?: string }) {
  return apiFetch<StoreSummary>('/stores', { method: 'POST', body: JSON.stringify(data) });
}
export function updateStore(id: string, data: Partial<{ name: string; status: string; templateId: string; theme: Record<string, unknown>; customDomain: string | null; siteType: string }>) {
  return apiFetch<StoreSummary>(`/stores/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function getStorePaymentConfig(id: string) {
  return apiFetch<StorePaymentConfigView>(`/stores/${encodeURIComponent(id)}/payment-config`);
}
export function updateStorePaymentConfig(id: string, data: Record<string, unknown>) {
  return apiFetch<{ ok: boolean }>(`/stores/${encodeURIComponent(id)}/payment-config`, { method: 'PUT', body: JSON.stringify(data) });
}

// ---- Platform overview (super-admin) ----
export type PlatformOverview = {
  totals: { stores: number; active: number; suspended: number; orders: number; revenue: number };
  stores: Array<{
    id: string; name: string; status: string; templateId: string;
    orderCount: number; revenue: number; pending: number;
    lastOrderAt: string | null; lowStock: number; hasPaymentConfig: boolean;
  }>;
  recent: Array<{ id: number; storeId: string; customerName: string; totalNpr: number; status: string; createdAt: string }>;
};

export function getPlatformOverview() {
  return apiFetch<PlatformOverview>('/stores/overview');
}

// ---- Admin users (super-admin manages store logins) ----
export type AdminUserView = { id: number; email: string; role: 'super' | 'store'; storeId: string | null };

export function getStoreAdmins(storeId: string) {
  return apiFetch<AdminUserView[]>(`/admin-auth/users?storeId=${encodeURIComponent(storeId)}`);
}
export function createStoreAdmin(data: { email: string; password: string; storeId: string; role?: 'store' | 'staff' }) {
  return apiFetch<AdminUserView>('/admin-auth/users', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: data.role ?? 'store' }),
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

export function updateOrderDelivery(id: string, data: { deliveryArea?: string; address?: string }) {
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

export type TemplateMeta = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  palette: string[];
  paletteLabels: string[];
};

/** Returns the list of available storefront templates from the API. */
export function getTemplates() { return apiFetch<TemplateMeta[]>('/templates'); }

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

export function getLeads() { return apiFetch<Lead[]>('/leads'); }
export function markLeadRead(id: number) {
  return apiFetch<Lead>(`/leads/${id}/read`, { method: 'PATCH', body: '{}' });
}
