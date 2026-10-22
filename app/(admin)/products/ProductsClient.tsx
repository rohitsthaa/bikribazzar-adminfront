'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  toggleAvailability, deleteProduct, bulkProductsAction, duplicateProductAction,
  mergeAsVariantsAction, removeSampleProductsAction,
} from './actions';
import type { BulkProductAction, Product } from '@/lib/api';
import { visibilityOf, type Visibility } from '@/lib/visibility';
import { stockSummary, STOCK_BADGE, marginPercent, suggestMerge } from '@/lib/stock';
import { slugify } from '@/lib/slug';

type Filter = 'all' | 'live' | 'hidden' | 'low' | 'oos' | 'draft' | 'archived';
type Counts = { all: number; live: number; hidden: number; low: number; oos: number; draft: number; archived: number };
type CategoryOption = { key: string; label: string; id: number };

const SORTS: { value: string; label: string }[] = [
  { value: '', label: 'Manual order' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'stock_asc', label: 'Stock: lowest first' },
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently edited' },
];

const VIS_PILL: Record<Visibility, string> = {
  live: 'bg-green-100 text-green-700',
  hidden: 'bg-gray-100 text-gray-500',
  draft: 'bg-blue-100 text-blue-700',
  archived: 'bg-stone-200 text-stone-600',
};
const VIS_LABEL: Record<Visibility, string> = { live: '● Live', hidden: '○ Hidden', draft: 'Draft', archived: 'Archived' };

/** Builds a /products URL from the current query, with `changes` applied and the page reset. */
function useHref() {
  const sp = useSearchParams();
  const pathname = usePathname();
  return (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    next.delete('page');
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '' || (k === 'bucket' && v === 'all') || (k === 'view' && v === 'table')) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
}

function Price({ p, currency }: { p: Product; currency: string }) {
  if (p.priceNpr === 0) return <span className="text-gray-400 font-normal">On request</span>;
  if (p.compareAtPriceNpr && p.compareAtPriceNpr > p.priceNpr) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-gray-400 line-through font-normal text-xs">{currency} {p.compareAtPriceNpr.toLocaleString()}</span>
        <span className="text-rose-600">{currency} {p.priceNpr.toLocaleString()}</span>
      </span>
    );
  }
  return <>{currency} {p.priceNpr.toLocaleString()}</>;
}

function StockBadge({ p }: { p: Product }) {
  const s = stockSummary(p);
  const dot = { untracked: 'bg-stone-400', out: 'bg-red-500', partial: 'bg-red-500', low: 'bg-amber-500', ok: 'bg-green-500' }[s.kind];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STOCK_BADGE[s.kind]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {s.label}
    </span>
  );
}

function VisibilityPill({ p }: { p: Product }) {
  const vis = visibilityOf(p);
  if (vis === 'draft' || vis === 'archived') {
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${VIS_PILL[vis]}`}>{VIS_LABEL[vis]}</span>;
  }
  return (
    <form action={toggleAvailability.bind(null, p.id, vis !== 'live')} onClick={(e) => e.stopPropagation()}>
      <button
        type="submit"
        title={vis === 'live' ? 'Click to hide from the shop' : 'Click to make live'}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors shadow-sm hover:brightness-95 ${VIS_PILL[vis]}`}
      >
        {VIS_LABEL[vis]}
      </button>
    </form>
  );
}

function Thumb({ p, className }: { p: Product; className: string }) {
  return p.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/image?src=${encodeURIComponent(p.image)}`} alt={p.name} className={`${className} object-cover`} />
  ) : (
    <div className={`${className} flex items-center justify-center text-stone-300 bg-stone-100`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-1/2 h-1/2 max-w-12 max-h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function RowActions({ p, canDelete }: { p: Product; canDelete: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState('');

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {canDelete && (confirming ? (
        <span className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Delete?</span>
          <button
            onClick={() => start(async () => {
              const r = await deleteProduct(p.id);
              if ('error' in r) { setError(r.error); setConfirming(false); }
            })}
            disabled={busy}
            className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg disabled:opacity-50"
          >{busy ? '…' : 'Yes'}</button>
          <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1.5">No</button>
        </span>
      ) : (
        <button onClick={() => setConfirming(true)} title="Delete product" aria-label="Delete product"
          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      ))}
      <button
        onClick={() => start(async () => {
          const r = await duplicateProductAction(p.id);
          if (r.ok) router.push(`/products/${r.id}`); else setError(r.error);
        })}
        disabled={busy}
        title="Duplicate as a hidden draft" aria-label="Duplicate product"
        className="p-1.5 text-gray-300 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </button>
      <Link href={`/products/${p.id}`} className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors">
        Edit →
      </Link>
      {error && <span role="alert" className="text-xs text-amber-700 max-w-48">{error}</span>}
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <input
      type="checkbox" checked={checked} aria-label={label}
      onChange={onChange} onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 rounded border-stone-300 text-[#c96a3a] focus:ring-[#c96a3a] cursor-pointer"
    />
  );
}

function ProductCard({ p, currency, canDelete, selected, onSelect }: {
  p: Product; currency: string; canDelete: boolean; selected: boolean; onSelect: () => void;
}) {
  const router = useRouter();
  const vis = visibilityOf(p);
  return (
    <div
      onClick={() => router.push(`/products/${p.id}`)}
      className={`group bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md cursor-pointer ${
        selected ? 'border-[#c96a3a] ring-1 ring-[#c96a3a]' : 'border-gray-200'
      } ${vis === 'live' ? '' : 'opacity-70'}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Thumb p={p} className="w-full h-full transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="bg-white/90 rounded-md p-1 shadow-sm flex"><Checkbox checked={selected} onChange={onSelect} label={`Select ${p.name}`} /></span>
          {p.tag && <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-700 rounded-full shadow-sm">{p.tag}</span>}
        </div>
        {!!p.compareAtPriceNpr && p.compareAtPriceNpr > p.priceNpr && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-rose-500/90 text-white text-xs font-medium rounded-full shadow-sm">Sale</span>
        )}
        <div className="absolute top-2.5 right-2.5"><VisibilityPill p={p} /></div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{p.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{p.sku || p.id}</p>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${p.categoryLabel ? 'bg-stone-100 text-stone-600' : 'bg-amber-50 text-amber-700'}`}>
            {p.categoryLabel ?? 'Uncategorized'}
          </span>
        </div>
        {p.details && <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-1">{p.details}</p>}
        <div className="mt-2"><StockBadge p={p} /></div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-900"><Price p={p} currency={currency} /></span>
          <RowActions p={p} canDelete={canDelete} />
        </div>
      </div>
    </div>
  );
}

function ProductTable({ products, currency, canDelete, selected, toggle, toggleAll }: {
  products: Product[]; currency: string; canDelete: boolean;
  selected: Set<string>; toggle: (id: string) => void; toggleAll: () => void;
}) {
  const router = useRouter();
  const allChecked = products.length > 0 && products.every((p) => selected.has(p.id));
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-stone-500 border-b border-stone-100">
            <th className="pl-4 py-3 w-8"><Checkbox checked={allChecked} onChange={toggleAll} label="Select all on this page" /></th>
            <th className="px-3 py-3 font-medium">Product</th>
            <th className="px-3 py-3 font-medium hidden md:table-cell">Category</th>
            <th className="px-3 py-3 font-medium">Stock</th>
            <th className="px-3 py-3 font-medium text-right">Price</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const margin = marginPercent(p.priceNpr, p.costNpr);
            return (
              <tr key={p.id} onClick={() => router.push(`/products/${p.id}`)}
                className={`border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer ${selected.has(p.id) ? 'bg-orange-50/40' : ''}`}>
                <td className="pl-4 py-2.5"><Checkbox checked={selected.has(p.id)} onChange={() => toggle(p.id)} label={`Select ${p.name}`} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Thumb p={p} className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-64">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono truncate max-w-64">{p.sku || p.id}{p.variants?.length ? ` · ${p.variants.length} options` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-xs">
                  {p.categoryLabel ?? <span className="text-amber-700">Uncategorized</span>}
                </td>
                <td className="px-3 py-2.5"><StockBadge p={p} /></td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <span className="font-medium text-gray-900"><Price p={p} currency={currency} /></span>
                  {margin !== null && <p className={`text-xs ${margin < 20 ? 'text-amber-700' : 'text-gray-400'}`}>{margin}% margin</p>}
                </td>
                <td className="px-3 py-2.5"><VisibilityPill p={p} /></td>
                <td className="px-3 py-2.5"><div className="flex justify-end"><RowActions p={p} canDelete={canDelete} /></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Toolbar({ categories, q, category, sort, view }: {
  categories: CategoryOption[]; q: string; category: string; sort: string; view: 'grid' | 'table';
}) {
  const router = useRouter();
  const href = useHref();
  const [text, setText] = useState(q);
  const first = useRef(true);

  // Debounced search: the list is filtered in SQL, so typing navigates rather than filters locally.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => router.replace(href({ q: text.trim() || null }), { scroll: false }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const select = 'h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300';
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-48">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Search name, description, details…" aria-label="Search products"
          className="h-9 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
      </div>
      <select aria-label="Category" value={category} onChange={(e) => router.replace(href({ category: e.target.value || null }), { scroll: false })} className={select}>
        <option value="">All categories</option>
        {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
      <select aria-label="Sort" value={sort} onChange={(e) => router.replace(href({ sort: e.target.value || null }), { scroll: false })} className={select}>
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <div className="flex rounded-xl border border-stone-200 bg-white p-0.5" role="group" aria-label="View">
        {(['table', 'grid'] as const).map((v) => (
          <Link key={v} href={href({ view: v })} scroll={false} aria-pressed={view === v}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === v ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-800'}`}>
            {v === 'table' ? 'List' : 'Cards'}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MergeDialog({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const router = useRouter();
  const suggestion = useMemo(() => suggestMerge(products.map((p) => p.name)), [products]);
  const [name, setName] = useState(suggestion.name);
  const [slug, setSlug] = useState(slugify(suggestion.name));
  const [slugTouched, setSlugTouched] = useState(false);
  const [axis, setAxis] = useState<'size' | 'color' | 'style' | ''>('size');
  const [labels, setLabels] = useState(suggestion.labels);
  const [error, setError] = useState('');
  const [busy, start] = useTransition();

  const minPrice = Math.min(...products.map((p) => p.priceNpr).filter((n) => n > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-stone-900">Combine into one product with options</h2>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          Customers get one listing with a picker instead of {products.length} separate cards. Each product&apos;s
          stock, price and SKU move to its option. The originals are archived (not deleted), so past orders keep working.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-medium text-stone-500">Product name
            <input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }}
              className="mt-1 h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-900" />
          </label>
          <label className="text-xs font-medium text-stone-500">URL slug
            <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              className="mt-1 h-9 w-full rounded-lg border border-stone-200 px-3 text-sm font-mono text-stone-900" />
          </label>
          <label className="text-xs font-medium text-stone-500">Options differ by
            <select value={axis} onChange={(e) => setAxis(e.target.value as typeof axis)}
              className="mt-1 h-9 w-full rounded-lg border border-stone-200 px-2 text-sm text-stone-900">
              <option value="size">Size</option>
              <option value="color">Colour (photo swatches)</option>
              <option value="style">Style (photo swatches)</option>
              <option value="">Other</option>
            </select>
          </label>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 border-b border-stone-100">
              <th className="py-2 font-medium">From product</th>
              <th className="py-2 font-medium">Option label</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="border-b border-stone-50">
                <td className="py-2 pr-3 text-xs text-stone-500 max-w-56 truncate">{p.name}</td>
                <td className="py-2 pr-3">
                  <input value={labels[i]} aria-label={`Option label for ${p.name}`}
                    onChange={(e) => setLabels((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
                    className="h-8 w-full rounded-lg border border-stone-200 px-2 text-sm" />
                </td>
                <td className="py-2 text-right text-xs whitespace-nowrap">
                  {p.priceNpr === 0 ? 'On request' : p.priceNpr.toLocaleString()}
                  {p.priceNpr > minPrice && <span className="block text-stone-400">own price</span>}
                </td>
                <td className="py-2 text-right text-xs">{p.stockQty ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && <p role="alert" className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancel</button>
          <button
            disabled={busy}
            onClick={() => start(async () => {
              setError('');
              const r = await mergeAsVariantsAction({
                id: slug, name, variantAxis: axis || null,
                items: products.map((p, i) => ({ productId: p.id, label: labels[i] })),
              });
              if (r.ok) router.push(`/products/${r.id}`); else setError(r.error);
            })}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium disabled:opacity-50"
          >{busy ? 'Combining…' : `Combine ${products.length} products`}</button>
        </div>
      </div>
    </div>
  );
}

function BulkBar({ selected, products, categories, canPrice, onClear }: {
  selected: string[]; products: Product[]; categories: CategoryOption[]; canPrice: boolean; onClear: () => void;
}) {
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState('');
  const [merging, setMerging] = useState(false);
  const run = (change: BulkProductAction) => start(async () => {
    setMsg('');
    const r = await bulkProductsAction(selected, change);
    if (r.ok) { setMsg(`Updated ${r.updated}.`); onClear(); } else setMsg(r.error);
  });
  const chosen = products.filter((p) => selected.includes(p.id));
  const canMerge = chosen.length >= 2 && chosen.every((p) => !p.variants?.length);
  const btn = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 disabled:opacity-40 whitespace-nowrap';

  return (
    <>
      <div className="sticky top-3 z-30 mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-stone-900 text-white px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium mr-1">{selected.length} selected</span>
        <button disabled={busy} onClick={() => run({ action: 'show' })} className={btn}>Make live</button>
        <button disabled={busy} onClick={() => run({ action: 'hide' })} className={btn}>Hide</button>
        <button disabled={busy} onClick={() => run({ action: 'archive' })} className={btn}>Archive</button>
        <select
          disabled={busy} value="" aria-label="Set category"
          onChange={(e) => { if (e.target.value) run({ action: 'category', categoryId: e.target.value === 'none' ? null : Number(e.target.value) }); }}
          className="h-8 rounded-lg bg-white/10 px-2 text-xs text-white [&>option]:text-stone-900"
        >
          <option value="">Set category…</option>
          <option value="none">Uncategorized</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {canPrice && (
          <button disabled={busy} className={btn} onClick={() => {
            const raw = window.prompt('Change prices by what percent? e.g. 10 to raise 10%, -15 to lower 15%');
            const pct = raw == null ? NaN : Number(raw.replace('%', '').trim());
            if (Number.isFinite(pct) && pct !== 0) run({ action: 'price_percent', percent: Math.round(pct) });
          }}>Change price %</button>
        )}
        <button
          disabled={busy || !canMerge} onClick={() => setMerging(true)} className={btn}
          title={canMerge ? 'Turn these into one product with size/colour options' : 'Select 2+ products that have no options yet'}
        >Combine as options</button>
        <span className="ml-auto flex items-center gap-3">
          {msg && <span className="text-xs text-stone-300" role="status">{msg}</span>}
          <button onClick={onClear} className="text-xs text-stone-300 hover:text-white">Clear</button>
        </span>
      </div>
      {merging && <MergeDialog products={chosen} onClose={() => setMerging(false)} />}
    </>
  );
}

function SampleBanner({ ids }: { ids: string[] }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState('');
  if (ids.length === 0) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-900 flex-1 min-w-60">
        <span className="font-medium">{ids.length} sample product{ids.length > 1 ? 's are' : ' is'} still in your catalogue.</span>{' '}
        They were added when your store was created, and customers can see them.
      </p>
      <button
        disabled={busy}
        onClick={() => start(async () => { const r = await removeSampleProductsAction(ids); if (!r.ok) setError(r.error); })}
        className="px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-medium hover:bg-amber-800 disabled:opacity-50"
      >{busy ? 'Removing…' : 'Remove samples'}</button>
      {error && <p role="alert" className="w-full text-xs text-amber-800">{error}</p>}
    </div>
  );
}

export default function ProductsClient({
  products, currency = 'NPR', canDelete = true, canPrice = true, counts, bucket,
  categories, q, category, sort, view, sampleIds,
}: {
  products: Product[];
  currency?: string;
  canDelete?: boolean;
  canPrice?: boolean;
  // Whole-catalogue counts from the server (they follow search/category, not the page).
  counts: Counts;
  bucket: string;
  categories: CategoryOption[];
  q: string;
  category: string;
  sort: string;
  view: 'grid' | 'table';
  sampleIds: string[];
}) {
  const filter = (['all', 'live', 'hidden', 'oos', 'low', 'draft', 'archived'].includes(bucket) ? bucket : 'all') as Filter;
  const href = useHref();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // A new page of results (filter/search/page change) starts with nothing selected.
  const pageKey = products.map((p) => p.id).join('|');
  useEffect(() => { setSelected(new Set()); }, [pageKey]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (products.every((p) => s.has(p.id)) ? new Set() : new Set(products.map((p) => p.id))));

  const tabs: { key: Filter; label: string; alert?: boolean }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'hidden', label: 'Hidden' },
    ...(counts.oos > 0 ? [{ key: 'oos' as Filter, label: 'Out of stock', alert: true }] : []),
    ...(counts.low > 0 ? [{ key: 'low' as Filter, label: 'Low stock', alert: true }] : []),
    ...(counts.draft > 0 ? [{ key: 'draft' as Filter, label: 'Draft' }] : []),
    ...(counts.archived > 0 ? [{ key: 'archived' as Filter, label: 'Archived' }] : []),
  ];
  const filtering = !!q || !!category;

  return (
    <>
      <SampleBanner ids={sampleIds} />
      <Toolbar categories={categories} q={q} category={category} sort={sort} view={view} />

      <div className="flex flex-wrap items-center gap-1 mb-5 bg-stone-100 rounded-xl p-1 w-fit max-w-full">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={href({ bucket: t.key })}
            scroll={false}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === t.key
                ? t.alert ? 'bg-red-500 text-white shadow-sm' : 'bg-[#c96a3a] text-white shadow-sm'
                : t.alert ? 'text-red-600 hover:bg-red-50' : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              filter === t.key ? 'bg-white/20 text-white' : t.alert ? 'bg-red-100 text-red-600' : 'bg-stone-200 text-stone-600'
            }`}>{counts[t.key]}</span>
          </Link>
        ))}
      </div>

      {selected.size > 0 && (
        <BulkBar selected={[...selected]} products={products} categories={categories} canPrice={canPrice} onClear={() => setSelected(new Set())} />
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">
            {filtering ? 'No products match' : filter === 'all' ? 'No products yet' : `No ${tabs.find((t) => t.key === filter)?.label.toLowerCase() ?? ''} products`}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filtering ? 'Try a different search or category.' : filter === 'all' ? 'Add your first product, or import a spreadsheet.' : ''}
          </p>
          {filtering && <Link href={href({ q: null, category: null })} className="mt-3 text-sm text-[#c96a3a] hover:underline">Clear search</Link>}
        </div>
      ) : view === 'table' ? (
        <ProductTable products={products} currency={currency} canDelete={canDelete} selected={selected} toggle={toggle} toggleAll={toggleAll} />
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2 text-xs text-stone-500">
            <Checkbox checked={products.every((p) => selected.has(p.id))} onChange={toggleAll} label="Select all on this page" />
            Select all on this page
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} currency={currency} canDelete={canDelete} selected={selected.has(p.id)} onSelect={() => toggle(p.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
