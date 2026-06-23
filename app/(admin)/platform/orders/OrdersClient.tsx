'use client';

import { useState } from 'react';
import type { PlatformOverview } from '@/lib/api';

type Order = PlatformOverview['recent'][number];
type Store = PlatformOverview['stores'][number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TZ = 'Asia/Kathmandu';
const money = (n: number) => `NPR ${n.toLocaleString()}`;
const fmtTime = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });

const AVATAR_COLORS = [
  '#6366f1', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#0284c7', '#c96a3a',
];

function storeColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  new:       { label: 'New',       cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  confirmed: { label: 'Confirmed', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  shipped:   { label: 'Shipped',   cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled: { label: 'Cancelled', cls: 'bg-stone-100 text-stone-500' },
};

// ─── Order row ────────────────────────────────────────────────────────────────

function OrderRow({ o, storeName }: { o: Order; storeName: string }) {
  const color = storeColor(o.storeId);
  const st = ORDER_STATUS[o.status] ?? { label: o.status, cls: 'bg-stone-100 text-stone-500' };

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50/70 transition-colors duration-100">
      {/* Store badge */}
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {storeName}
      </span>

      {/* Order # */}
      <span className="text-xs font-mono text-stone-400 flex-shrink-0 w-10 text-right">
        #{o.id}
      </span>

      {/* Customer */}
      <span className="text-sm text-stone-700 flex-1 min-w-0 truncate">
        {o.customerName}
      </span>

      {/* Status */}
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
        {st.label}
      </span>

      {/* Amount */}
      <span className="text-sm font-semibold text-stone-800 flex-shrink-0 tabular-nums hidden sm:block">
        {money(o.totalNpr)}
      </span>

      {/* Time */}
      <span className="text-xs text-stone-400 flex-shrink-0 hidden md:block w-36 text-right">
        {fmtTime(o.createdAt)}
      </span>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function OrdersClient({ orders, stores }: { orders: Order[]; stores: Store[] }) {
  const [storeFilter,  setStoreFilter]  = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const nameOf = (id: string) => stores.find((s) => s.id === id)?.name ?? id;

  const filtered = orders.filter((o) => {
    const matchesStore  = storeFilter  === 'all' || o.storeId === storeFilter;
    const matchesStatus = statusFilter === 'all' || o.status  === statusFilter;
    return matchesStore && matchesStatus;
  });

  const uniqueStatuses = Array.from(new Set(orders.map((o) => o.status)));

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Store filter */}
        <div className="relative">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-150 cursor-pointer"
          >
            <option value="all">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              statusFilter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            All
            <span className="ml-1.5 text-stone-400 tabular-nums">{orders.length}</span>
          </button>
          {uniqueStatuses.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            const st = ORDER_STATUS[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  statusFilter === s ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {st?.label ?? s}
                <span className="ml-1.5 text-stone-400 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 border-b border-stone-100 bg-stone-50/60">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 w-24">Store</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 w-10 text-right">#</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 flex-1">Customer</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 w-24 text-right">Amount</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 w-36 text-right">Time</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-stone-600">No orders match your filters</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting the store or status filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((o) => (
              <OrderRow key={`${o.storeId}-${o.id}`} o={o} storeName={nameOf(o.storeId)} />
            ))}
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <p className="text-xs text-stone-400 text-right">
          {filtered.length < orders.length
            ? `${filtered.length} of ${orders.length} shown`
            : `${orders.length} most recent orders`}
          {' · '}
          <span className="text-stone-300">Full paginated history requires a /orders/all endpoint.</span>
        </p>
      )}
    </div>
  );
}
