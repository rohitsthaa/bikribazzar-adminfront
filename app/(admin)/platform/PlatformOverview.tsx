import Link from 'next/link';
import type { PlatformOverview as Data } from '@/lib/api';
import { enterStore } from '../store-actions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TZ = 'Asia/Kathmandu';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short' }) : null;

const fmtTime = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });

const money = (n: number) => `NPR ${n.toLocaleString()}`;

// Deterministic colour per store slug — avoids always showing the same colour.
const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#0891b2', // cyan
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#7c3aed', // violet
  '#0284c7', // sky
  '#c96a3a', // terracotta
];

function storeColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function storeInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Status badge colours ─────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, string> = {
  new:       'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  confirmed: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  shipped:   'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  cancelled: 'bg-stone-100 text-stone-500',
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl border border-stone-200 p-5 overflow-hidden">
      {/* Accent blob */}
      <span
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.07] pointer-events-none"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between mb-4">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold text-stone-900 tracking-tight leading-none">{value}</p>
      <p className="text-xs text-stone-400 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-stone-300 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Store row ────────────────────────────────────────────────────────────────

function StoreRow({ s }: {
  s: Data['stores'][number];
}) {
  const color = storeColor(s.id);
  const initials = storeInitials(s.name);
  const lastOrder = fmtDate(s.lastOrderAt);

  const flags: { label: string; color: string }[] = [];
  if (s.pending > 0)       flags.push({ label: `${s.pending} pending`,        color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' });
  if (s.lowStock > 0)      flags.push({ label: `${s.lowStock} low stock`,      color: 'bg-red-50 text-red-600 ring-1 ring-red-100' });
  if (!s.hasPaymentConfig) flags.push({ label: 'no payment config',            color: 'bg-stone-100 text-stone-500' });

  const isHealthy = s.status === 'active' && flags.length === 0;

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/70 transition-colors duration-100 group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {initials}
        </span>
        {/* Health dot */}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          s.status !== 'active' ? 'bg-stone-400' :
          flags.length > 0     ? 'bg-amber-400' :
                                 'bg-emerald-400'
        }`} />
      </div>

      {/* Identity + flags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-stone-900">{s.name}</span>
          {s.status !== 'active' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
              {s.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[11px] text-stone-400">{s.id}</span>
          {flags.map((f) => (
            <span key={f.label} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${f.color}`}>
              {f.label}
            </span>
          ))}
          {isHealthy && (
            <span className="text-[10px] text-emerald-600 font-medium">All good</span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="hidden lg:flex items-center gap-6 text-right flex-shrink-0">
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlatformOverview({ data }: { data: Data }) {
  const { totals, stores, recent } = data;
  const nameOf = (id: string) => stores.find((s) => s.id === id)?.name ?? id;

  const stats = [
    {
      label: 'Active stores',
      value: `${totals.active} / ${totals.stores}`,
      sub: totals.suspended ? `${totals.suspended} suspended` : undefined,
      accent: '#6366f1',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="9" height="9" rx="2"/><rect x="13" y="3" width="9" height="9" rx="2"/>
          <rect x="2" y="14" width="9" height="9" rx="2"/><rect x="13" y="14" width="9" height="9" rx="2"/>
        </svg>
      ),
    },
    {
      label: 'Total orders',
      value: totals.orders.toLocaleString(),
      accent: '#0891b2',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
        </svg>
      ),
    },
    {
      label: 'Total revenue',
      value: money(totals.revenue),
      accent: '#059669',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Avg per store',
      value: money(totals.stores ? Math.round(totals.revenue / totals.stores) : 0),
      accent: '#d97706',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Stores ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Stores</h2>
            <p className="text-xs text-stone-400 mt-0.5">Click "Enter" to manage a store, "Config" to edit its settings.</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">
            {stores.length} total
          </span>
        </div>

        {stores.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-stone-400">No stores yet — create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {stores.map((s) => <StoreRow key={s.id} s={s} />)}
          </div>
        )}
      </div>

      {/* ── Recent orders ──────────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">Recent orders</h2>
            <p className="text-xs text-stone-400 mt-0.5">Latest activity across all stores.</p>
          </div>
          <ul className="divide-y divide-stone-100">
            {recent.map((o) => {
              const color = storeColor(o.storeId);
              return (
                <li key={`${o.storeId}-${o.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-stone-50/60 transition-colors duration-100">
                  {/* Store dot */}
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {/* Store badge */}
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {nameOf(o.storeId)}
                  </span>
                  {/* Order info */}
                  <span className="text-sm text-stone-700 flex-1 min-w-0 truncate">
                    #{o.id} · {o.customerName}
                  </span>
                  {/* Status */}
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ORDER_STATUS[o.status] ?? 'bg-stone-100 text-stone-500'}`}>
                    {o.status}
                  </span>
                  {/* Amount */}
                  <span className="text-sm font-semibold text-stone-800 flex-shrink-0 hidden sm:block tabular-nums">
                    {money(o.totalNpr)}
                  </span>
                  {/* Time */}
                  <span className="text-xs text-stone-400 flex-shrink-0 hidden md:block w-32 text-right">
                    {fmtTime(o.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

    </div>
  );
}
