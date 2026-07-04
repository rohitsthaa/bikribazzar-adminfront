'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleAvailability, deleteProduct } from './actions';
import type { Product } from '@/lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  shelf: 'bg-amber-100 text-amber-700',
  hanger: 'bg-teal-100 text-teal-700',
  wall: 'bg-violet-100 text-violet-700',
  custom: 'bg-rose-100 text-rose-700',
};

type Filter = 'all' | 'live' | 'hidden' | 'low' | 'oos' | 'draft' | 'archived';

function ProductCard({ p, currency, canDelete }: { p: Product; currency: string; canDelete: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState('');

  function handleDelete() {
    setDeleteError('');
    startDelete(async () => {
      const result = await deleteProduct(p.id);
      if ('error' in result) {
        setDeleteError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div
      className={`group bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
        p.available ? 'border-gray-200' : 'border-gray-200 opacity-60'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image?src=${encodeURIComponent(p.image)}`}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {p.tag && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-700 rounded-full shadow-sm">
            {p.tag}
          </span>
        )}
        {p.status && p.status !== 'active' && (
          <span
            className={`absolute ${p.tag ? 'top-9' : 'top-2.5'} left-2.5 px-2 py-0.5 backdrop-blur-sm text-xs font-medium rounded-full shadow-sm capitalize ${
              p.status === 'draft' ? 'bg-blue-100/90 text-blue-700' : 'bg-stone-200/90 text-stone-600'
            }`}
          >
            {p.status}
          </span>
        )}
        {!!p.compareAtPriceNpr && p.compareAtPriceNpr > p.priceNpr && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-rose-500/90 text-white text-xs font-medium rounded-full shadow-sm">
            Sale
          </span>
        )}
        {/* Availability toggle */}
        <div className="absolute top-2.5 right-2.5">
          <form action={toggleAvailability.bind(null, p.id, !p.available)}>
            <button
              type="submit"
              title={p.available ? 'Click to hide' : 'Click to make live'}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors shadow-sm ${
                p.available
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {p.available ? '● Live' : '○ Hidden'}
            </button>
          </form>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{p.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.id}</p>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {p.category}
          </span>
        </div>

        {p.details && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-1">{p.details}</p>
        )}

        {/* Stock badge */}
        {p.stockQty !== null && (() => {
          const isOOS = p.stockQty === 0;
          const isLow = !isOOS && p.reorderPoint > 0 && p.stockQty <= p.reorderPoint;
          if (isOOS) return (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Out of stock
            </span>
          );
          if (isLow) return (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Low: {p.stockQty} left
            </span>
          );
          return (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {p.stockQty} in stock
            </span>
          );
        })()}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            {p.priceNpr === 0 ? (
              <span className="text-gray-400 font-normal">On request</span>
            ) : !!p.compareAtPriceNpr && p.compareAtPriceNpr > p.priceNpr ? (
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400 line-through font-normal text-xs">{currency} {p.compareAtPriceNpr.toLocaleString()}</span>
                <span className="text-rose-600">{currency} {p.priceNpr.toLocaleString()}</span>
              </span>
            ) : (
              <>{currency} {p.priceNpr.toLocaleString()}</>
            )}
          </span>

          <div className="flex items-center gap-2">
            {/* Delete — inline confirm (owners only; hidden from staff) */}
            {canDelete && (confirming ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1.5 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                title="Delete product"
                className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </button>
            ))}

            <Link
              href={`/products/${p.id}`}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit →
            </Link>
          </div>
        </div>
        {deleteError && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            {deleteError}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProductsClient({ products, currency = 'NPR', canDelete = true }: { products: Product[]; currency?: string; canDelete?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = products.filter(p => {
    if (filter === 'live') return p.available;
    if (filter === 'hidden') return !p.available;
    if (filter === 'oos') return p.stockQty !== null && p.stockQty === 0;
    if (filter === 'low') return p.stockQty !== null && p.stockQty > 0 && p.reorderPoint > 0 && p.stockQty <= p.reorderPoint;
    if (filter === 'draft') return p.status === 'draft';
    if (filter === 'archived') return p.status === 'archived';
    return true;
  });

  const lowCount = products.filter(p => p.stockQty !== null && p.stockQty > 0 && p.reorderPoint > 0 && p.stockQty <= p.reorderPoint).length;
  const oosCount = products.filter(p => p.stockQty !== null && p.stockQty === 0).length;
  const draftCount = products.filter(p => p.status === 'draft').length;
  const archivedCount = products.filter(p => p.status === 'archived').length;

  const counts = {
    all: products.length,
    live: products.filter(p => p.available).length,
    hidden: products.filter(p => !p.available).length,
    low: lowCount,
    oos: oosCount,
    draft: draftCount,
    archived: archivedCount,
  };

  const tabs: { key: Filter; label: string; alert?: boolean }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'hidden', label: 'Hidden' },
    ...(oosCount > 0 ? [{ key: 'oos' as Filter, label: 'Out of stock', alert: true }] : []),
    ...(lowCount > 0 ? [{ key: 'low' as Filter, label: 'Low stock', alert: true }] : []),
    ...(draftCount > 0 ? [{ key: 'draft' as Filter, label: 'Draft' }] : []),
    ...(archivedCount > 0 ? [{ key: 'archived' as Filter, label: 'Archived' }] : []),
  ];

  return (
    <>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === t.key
                ? t.alert ? 'bg-red-500 text-white shadow-sm' : 'bg-[#c96a3a] text-white shadow-sm'
                : t.alert ? 'text-red-600 hover:bg-red-50' : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              filter === t.key ? 'bg-white/20 text-white' : t.alert ? 'bg-red-100 text-red-600' : 'bg-stone-200 text-stone-600'
            }`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-4xl mb-3">🪴</div>
          <p className="text-gray-500 font-medium">
            {filter === 'hidden' ? 'No hidden products' : filter === 'live' ? 'No live products' : 'No products yet'}
          </p>
          {filter === 'all' && (
            <p className="text-sm text-gray-400 mt-1">Add your first handwoven piece to get started.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} currency={currency} canDelete={canDelete} />
          ))}
        </div>
      )}
    </>
  );
}
