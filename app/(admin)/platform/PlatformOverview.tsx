import Link from 'next/link';
import type { PlatformOverview as Data } from '@/lib/api';
import { enterStore } from '../store-actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const money = (n: number) => `NPR ${n.toLocaleString()}`;

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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl border border-stone-200 p-5 overflow-hidden">
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

// ─── Quick nav card ───────────────────────────────────────────────────────────

function QuickNavCard({ href, label, sub, accent, icon }: {
  href: string; label: string; sub: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl border border-stone-200 p-5 overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all duration-150 flex items-center gap-4"
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 80% 50%, ${accent}08, transparent 70%)` }}
      />
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        style={{ backgroundColor: `${accent}14`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
      </div>
      <span className="ml-auto text-stone-300 group-hover:text-stone-500 transition-colors duration-150 flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>
    </Link>
  );
}

// ─── Attention row (compact) ──────────────────────────────────────────────────

function AttentionRow({ s }: { s: Data['stores'][number] }) {
  const color = storeColor(s.id);
  const initials = storeInitials(s.name);

  const flags: { label: string; cls: string }[] = [];
  if (s.status !== 'active')  flags.push({ label: s.status,              cls: 'bg-stone-100 text-stone-500' });
  if (s.pending > 0)          flags.push({ label: `${s.pending} pending`, cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' });
  if (s.lowStock > 0)         flags.push({ label: `${s.lowStock} low stock`, cls: 'bg-red-50 text-red-600 ring-1 ring-red-100' });
  if (!s.hasPaymentConfig)    flags.push({ label: 'no payment',          cls: 'bg-stone-100 text-stone-500' });

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50/70 transition-colors duration-100 group">
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900">{s.name}</p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {flags.map((f) => (
            <span key={f.label} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${f.cls}`}>
              {f.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link
          href={`/platform/${s.id}`}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-800 hover:bg-stone-50 transition-all duration-150"
        >
          Config
        </Link>
        <form action={enterStore.bind(null, s.id)}>
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#c96a3a] hover:bg-[#b85f33] active:scale-95 transition-all duration-150 shadow-sm"
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
  const { totals, stores } = data;

  const attentionStores = stores.filter((s) =>
    s.status !== 'active' || s.pending > 0 || s.lowStock > 0 || !s.hasPaymentConfig
  );

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

      {/* ── Quick nav ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickNavCard
          href="/platform/stores"
          label="All stores"
          sub={`${totals.stores} store${totals.stores !== 1 ? 's' : ''} · browse, search & configure`}
          accent="#6366f1"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />
        <QuickNavCard
          href="/platform/orders"
          label="All orders"
          sub={`${totals.orders.toLocaleString()} orders across all stores`}
          accent="#0891b2"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
          }
        />
      </div>

      {/* ── Needs attention ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Needs attention</h2>
            <p className="text-xs text-stone-400 mt-0.5">Stores with pending orders, low stock, or missing config.</p>
          </div>
          {attentionStores.length > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              {attentionStores.length} store{attentionStores.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {attentionStores.length === 0 ? (
          <div className="px-5 py-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-stone-800">All stores are healthy</p>
              <p className="text-xs text-stone-400 mt-0.5">No pending items, stock issues, or missing configs.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {attentionStores.map((s) => <AttentionRow key={s.id} s={s} />)}
          </div>
        )}
      </div>

      {/* ── Store performance ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Store performance</h2>
            <p className="text-xs text-stone-400 mt-0.5">All stores · sorted by revenue</p>
          </div>
          <Link
            href="/platform/stores"
            className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors duration-150"
          >
            Manage all →
          </Link>
        </div>

        {/* Header row */}
        <div className="hidden md:grid grid-cols-[1fr_80px_120px_80px_120px_120px] gap-4 px-5 py-2 border-b border-stone-50 bg-stone-50/60">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Store</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 text-right">Orders</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 text-right">Revenue</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 text-right">Pending</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Last order</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 text-right">Actions</span>
        </div>

        <div className="divide-y divide-stone-100">
          {[...stores].sort((a, b) => b.revenue - a.revenue).map((s) => {
            const color = storeColor(s.id);
            const initials = storeInitials(s.name);
            const lastOrder = s.lastOrderAt
              ? (() => {
                  const diff = Math.floor((Date.now() - new Date(s.lastOrderAt).getTime()) / 86400000);
                  if (diff === 0) return 'Today';
                  if (diff === 1) return 'Yesterday';
                  if (diff < 30) return `${diff}d ago`;
                  return new Date(s.lastOrderAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                })()
              : 'Never';
            const isDormant = !s.lastOrderAt || (Date.now() - new Date(s.lastOrderAt).getTime()) > 30 * 86400000;

            return (
              <div
                key={s.id}
                className="flex md:grid md:grid-cols-[1fr_80px_120px_80px_120px_120px] gap-4 items-center px-5 py-3 hover:bg-stone-50/60 transition-colors duration-100"
              >
                {/* Store name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{s.name}</p>
                    {s.status !== 'active' && (
                      <span className="text-[10px] text-stone-400 font-medium">{s.status}</span>
                    )}
                  </div>
                </div>

                {/* Orders */}
                <p className="hidden md:block text-sm text-stone-700 text-right tabular-nums">
                  {s.orderCount.toLocaleString()}
                </p>

                {/* Revenue */}
                <p className="hidden md:block text-sm font-semibold text-stone-800 text-right tabular-nums">
                  {s.revenue > 0 ? money(s.revenue) : <span className="text-stone-300 font-normal">—</span>}
                </p>

                {/* Pending */}
                <p className="hidden md:block text-right">
                  {s.pending > 0 ? (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-100 px-2 py-0.5 rounded-full">
                      {s.pending}
                    </span>
                  ) : (
                    <span className="text-stone-300 text-sm">—</span>
                  )}
                </p>

                {/* Last order */}
                <p className={`hidden md:block text-xs ${isDormant ? 'text-stone-300' : 'text-stone-500'}`}>
                  {lastOrder}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end flex-shrink-0 ml-auto md:ml-0">
                  <Link
                    href={`/platform/${s.id}`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-800 hover:bg-stone-50 transition-all duration-150"
                  >
                    Config
                  </Link>
                  <form action={enterStore.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#c96a3a] hover:bg-[#b85f33] active:scale-95 transition-all duration-150 shadow-sm"
                    >
                      Enter →
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
