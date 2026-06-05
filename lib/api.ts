/**
 * Server-side only API client. Never imported from client components.
 * Attaches the internal token for write operations.
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': TOKEN,
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

export type Product = {
  id: string;
  name: string;
  description: string;
  priceNpr: number;
  category: 'shelf' | 'hanger' | 'wall' | 'custom';
  details: string | null;
  tag: string | null;
  image: string;
  available: boolean;
  sortOrder: number;
};

export function getProducts() { return apiFetch<Product[]>('/products'); }
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

// ---- Materials ----

export type Material = { id: number; label: string; sortOrder: number };

export function getMaterials() { return apiFetch<Material[]>('/materials'); }
export function createMaterial(data: { label: string; sortOrder?: number }) {
  return apiFetch<Material>('/materials', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteMaterial(id: number) {
  return apiFetch(`/materials/${id}`, { method: 'DELETE' });
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

export type Order = {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; priceNpr: number }>;
  totalNpr: number;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export function getOrders() { return apiFetch<Order[]>('/orders'); }
export function getOrder(id: string) { return apiFetch<Order>(`/orders/${id}`); }
export function updateOrderStatus(id: string, status: Order['status']) {
  return apiFetch<Order>(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
