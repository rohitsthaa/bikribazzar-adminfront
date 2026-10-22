import type { Product } from './api';

export type StockSummary = {
  kind: 'untracked' | 'out' | 'partial' | 'low' | 'ok';
  label: string;
};

/**
 * One line describing a product's stock, for the list views. A product with options is
 * judged on its options — its own stockQty is unused once variants exist (the order flow
 * decrements the variant). Mirrors the API's "oos"/"low" buckets in ProductEndpoints.cs.
 */
export function stockSummary(p: Pick<Product, 'stockQty' | 'reorderPoint' | 'variants'>): StockSummary {
  const variants = p.variants ?? [];
  if (variants.length > 0) {
    const tracked = variants.filter((v) => v.stockQty !== null);
    if (tracked.length === 0) return { kind: 'untracked', label: 'Stock not tracked' };
    const out = tracked.filter((v) => v.stockQty === 0);
    const total = tracked.reduce((n, v) => n + (v.stockQty ?? 0), 0);
    if (out.length === variants.length) return { kind: 'out', label: 'Out of stock' };
    if (out.length > 0) {
      const names = out.slice(0, 2).map((v) => v.label).join(', ') + (out.length > 2 ? '…' : '');
      return { kind: 'partial', label: `${names} sold out · ${total} left` };
    }
    const low = tracked.filter((v) => p.reorderPoint > 0 && (v.stockQty ?? 0) <= p.reorderPoint);
    if (low.length > 0) return { kind: 'low', label: `Low: ${low.map((v) => `${v.label} ${v.stockQty}`).slice(0, 2).join(', ')}` };
    return { kind: 'ok', label: `${total} in stock · ${variants.length} options` };
  }
  if (p.stockQty === null) return { kind: 'untracked', label: 'Stock not tracked' };
  if (p.stockQty === 0) return { kind: 'out', label: 'Out of stock' };
  if (p.reorderPoint > 0 && p.stockQty <= p.reorderPoint) return { kind: 'low', label: `Low: ${p.stockQty} left` };
  return { kind: 'ok', label: `${p.stockQty} in stock` };
}

export const STOCK_BADGE: Record<StockSummary['kind'], string> = {
  untracked: 'bg-stone-100 text-stone-500',
  out:       'bg-red-50 text-red-600',
  partial:   'bg-red-50 text-red-600',
  low:       'bg-amber-50 text-amber-700',
  ok:        'bg-green-50 text-green-700',
};

/** Margin as a whole-number percent of price, or null when either side is missing. */
export function marginPercent(price: number, cost: number | null | undefined): number | null {
  if (!cost || price <= 0) return null;
  return Math.round(((price - cost) / price) * 100);
}

/**
 * Suggested name + per-product option labels when combining several products into one,
 * e.g. ["Cotton Kurta — Indigo, S", "Cotton Kurta — Indigo, M"] → "Cotton Kurta — Indigo",
 * ["S", "M"]. Cuts back to a word boundary so "Tee — White" never becomes "Tee — Whi".
 */
export function suggestMerge(names: string[]): { name: string; labels: string[] } {
  if (names.length === 0) return { name: '', labels: [] };
  let prefix = names[0];
  for (const n of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < n.length && prefix[i].toLowerCase() === n[i].toLowerCase()) i++;
    prefix = prefix.slice(0, i);
  }
  const shortest = Math.min(...names.map((n) => n.length));
  if (prefix.length < shortest) {
    const cut = Math.max(prefix.lastIndexOf(' '), prefix.lastIndexOf(','), prefix.lastIndexOf('/'));
    prefix = cut >= 0 ? prefix.slice(0, cut + 1) : '';
  }
  const trimEnd = (s: string) => s.replace(/[\s,—–\-/:(]+$/u, '');
  const trimStart = (s: string) => s.replace(/^[\s,—–\-/:)]+/u, '');
  const name = trimEnd(prefix) || names[0];
  const labels = names.map((n) => trimStart(n.slice(prefix.length)).trim() || n);
  return { name, labels };
}
