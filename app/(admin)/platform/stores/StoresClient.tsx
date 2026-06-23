'use client';

import { useState } from 'react';
import Link from 'next/link';
import { enterStore } from '../../store-actions';
import type { PlatformOverview } from '@/lib/api';

type StoreSummary = PlatformOverview['stores'][number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TZ = 'Asia/Kathmandu';
const money = (n: number) => `NPR ${n.toLocaleString()}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short' }) : null;

const AVATAR_COLORS = [
  '#6366f1', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#0284c7', '#c96a3a',
];

function storeColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function storeInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Store row ────────────────────────────────────────────────────────────────

function StoreRow({ s }: { s: StoreSummary }) {
  const color = storeColor(s.id);
  const initials = storeInitials(s.name);
  const lastOrder = fmtDate(s.lastOrderAt);

  const flags: { label: string; cls: string }[] = [];
  if (s.pending > 0)       flags.push({ label: `${s.pending} pending`,      cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' });
  if (s.lowStock > 0)      flags.push({ label: `${s.lowStock} low stock`,    cls: 'bg-red-50 text-red-600 ring-1 ring-red-100' });
  if (!s.hasPaymentConfig) flags.push({ label: 'no payment config',          cls: 'bg-stone-100 text-stone-500' });

  const isHealthy = s.status === 'active' && flags.length === 0;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50/70 transition-colors duration-100">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {initials}
        </span>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          s.status !== 'active' ? 'bg-stone-400' :
          flags.length > 0     ? 'bg-amber-400' :
                                 'bg-emerald-400'
        }`} />
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-stone-900">{s.name}</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {s.templateId}
          </span>
          {s.status !== 'active' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
              {s.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[11px] text-stone-400 font-mono">{s.id}</span>
          {flags.map((f) => (
            <span key={f.label} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${f.cls}`}>
              {f.label}
            </span>
          ))}
          {isHealthy && (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Healthy
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="hidden lg:flex items-center gap-5 text-right flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-stone-800">{s.orderCount.toLocaleString()}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wide">orders</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">{money(s.revenue)}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wide">revenue</p>
        </div>
        <div>
          <p className="text-sm text-stone-500">{lastOrder ?? '—'}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wide">last order</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/platform/${s.id}`}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-800 hover:bg-stone-50 transition-all duration-150"
        >
          Config
        </Link>
        <form action={enterStore.bind(null, s.id)}>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#c96a3a] hover:bg-[#b85f33] active:scale-95 transition-all duration-150 shadow-sm"
          >
            Enter →
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-5 py-14 text-center">
      {query ? (
        <>
          <p className="text-sm font-medium text-stone-600">No stores match "{query}"</p>
          <p className="text-xs text-stone-400 mt-1">Try a different name or slug.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-stone-600">No stores yet</p>
          <p className="text-xs text-stone-400 mt-1">Create one to get started.</p>
        </>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function StoresClient({ stores }: { stores: StoreSummary[] }) {
  const [query, setQuery]   = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');

  const filtered = stores.filter((s) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchesStatus =
      status === 'all'       ? true :
      status === 'suspended' ? s.status !== 'active' :
                               s.status === 'active';
    return matchesQuery && matchesStatus;
  });

  const counts = {
    all:       stores.length,
    active:    stores.filter((s) => s.status === 'active').length,
    suspended: stores.filter((s) => s.status !== 'active').length,
  };

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Search stores by name or slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-150"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 flex-shrink-0">
          {(['all', 'active', 'suspended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                status === s
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={`ml-1.5 tabular-nums ${status === s ? 'text-stone-400' : 'text-stone-400'}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Store list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((s) => <StoreRow key={s.id} s={s} />)}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 text-right">
          {filtered.length} of {stores.length} store{stores.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
