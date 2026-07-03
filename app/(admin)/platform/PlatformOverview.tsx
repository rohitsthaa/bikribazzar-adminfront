import Link from 'next/link';
import type { PlatformOverview as Data } from '@/lib/api';
import { enterStore } from '../store-actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const money = (n: number) =>
  n >= 100000
    ? `NPR ${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `NPR ${(n / 1000).toFixed(1)}k`
    : `NPR ${n.toLocaleString()}`;

const DAYS = (n: number) => n * 86_400_000;

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

function relativeDay(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 30)  return `${diff}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── Store chip (used in lifecycle grid) ─────────────────────────────────────

function StoreChip({ s, sub }: { s: Data['stores'][number]; sub?: string }) {
  const color = storeColor(s.id);
  const initials = storeInitials(s.name);
  return (
    <form action={enterStore.bind(null, s.id)} className="group w-full">
      <button
        type="submit"
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all duration-150 text-left"
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-800 truncate leading-snug">{s.name}</p>
          {sub && <p className="text-[11px] text-stone-400 leading-snug truncate">{sub}</p>}
        </div>
        <span className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      </button>
    </form>
  );
}

// ─── Lifecycle segment card ───────────────────────────────────────────────────

function LifecycleCard({
  icon, label, count, accent, stores: storeList, sub,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: string;
  stores: Data['stores'];
  sub: (s: Data['stores'][number]) => string | undefined;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            {icon}
          </span>
          <span className="text-sm font-semibold text-stone-900">{label}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {count}
        </span>
      </div>

      {storeList.length === 0 ? (
        <p className="text-xs text-stone-300 px-1 py-2">None right now</p>
      ) : (
        <div className="space-y-0.5">
          {storeList.map((s) => (
            <StoreChip key={s.id} s={s} sub={sub(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attention row ────────────────────────────────────────────────────────────

function AttentionRow({ s }: { s: Data['stores'][number] }) {
  const color = storeColor(s.id);
  const initials = storeInitials(s.name);

  const flags: { label: string; cls: string }[] = [];
  if (s.status !== 'active')  flags.push({ label: s.status,                 cls: 'bg-stone-100 text-stone-500' });
  if (s.pending > 0)          flags.push({ label: `${s.pending} pending`,   cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' });
  if (s.lowStock > 0)         flags.push({ label: `${s.lowStock} low stock`,cls: 'bg-red-50 text-red-600 ring-1 ring-red-100' });
  if (!s.hasPaymentConfig)    flags.push({ label: 'no payment',             cls: 'bg-stone-100 text-stone-500' });

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50/70 transition-colors duration-100">
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
  const now = Date.now();

  // Lifecycle segments
  const active  = stores.filter(s => s.lastOrderAt && now - new Date(s.lastOrderAt).getTime() <= DAYS(7));
  const growing = stores.filter(s => s.lastOrderAt && now - new Date(s.lastOrderAt).getTime() > DAYS(7) && now - new Date(s.lastOrderAt).getTime() <= DAYS(30));
  const dormant = stores.filter(s => s.lastOrderAt && now - new Date(s.lastOrderAt).getTime() > DAYS(30));
  const never   = stores.filter(s => !s.lastOrderAt);

  // Needs attention
  const attentionStores = stores.filter((s) =>
    s.status !== 'active' || s.pending > 0 || s.lowStock > 0 || !s.hasPaymentConfig
  );

  // Platform digest sentence
  const digestParts: string[] = [];
  if (active.length)  digestParts.push(`${active.length} store${active.length > 1 ? 's' : ''} taking orders`);
  if (growing.length) digestParts.push(`${growing.length} growing`);
  if (dormant.length) digestParts.push(`${dormant.length} dormant`);
  if (never.length)   digestParts.push(`${never.length} waiting for first sale`);
  const digest = digestParts.join(' · ');

  // Revenue bar (only show if there's any revenue at all)
  const totalRev = totals.revenue;
  const topStores = [...stores]
    .filter(s => s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Stores',
            value: totals.stores,
            detail: `${totals.active} active`,
            accent: '#6366f1',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="9" height="9" rx="2"/><rect x="13" y="3" width="9" height="9" rx="2"/>
                <rect x="2" y="14" width="9" height="9" rx="2"/><rect x="13" y="14" width="9" height="9" rx="2"/>
              </svg>
            ),
          },
          {
            label: 'Orders',
            value: totals.orders,
            detail: totals.orders > 0 ? `across ${stores.filter(s => s.orderCount > 0).length} stores` : 'none yet',
            accent: '#0891b2',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
              </svg>
            ),
          },
          {
            label: 'Revenue',
            value: totals.revenue > 0 ? money(totals.revenue) : '—',
            detail: totals.revenue > 0 ? `${money(Math.round(totals.revenue / Math.max(totals.active, 1)))} avg / store` : 'no completed orders',
            accent: '#059669',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            ),
          },
          {
            label: 'Pending',
            value: stores.reduce((acc, s) => acc + s.pending, 0),
            detail: stores.reduce((acc, s) => acc + s.pending, 0) > 0
              ? `across ${stores.filter(s => s.pending > 0).length} stores`
              : 'all clear',
            accent: '#d97706',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            ),
          },
        ].map(({ label, value, detail, accent, icon }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-stone-200 px-4 py-4 flex items-center gap-3"
          >
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold text-stone-900 leading-none tabular-nums">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5 truncate">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Platform digest ────────────────────────────────────────────────── */}
      {digest && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
          <p className="text-sm text-indigo-700">{digest}</p>
        </div>
      )}

      {/* ── Revenue bar (only if meaningful) ───────────────────────────────── */}
      {totalRev > 0 && topStores.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Revenue share</p>
          <div className="space-y-2.5">
            {topStores.map((s) => {
              const pct = Math.max(Math.round((s.revenue / totalRev) * 100), 2);
              const color = storeColor(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-xs text-stone-600 w-28 truncate flex-shrink-0">{s.name}</span>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-stone-700 w-20 text-right flex-shrink-0 tabular-nums">
                    {money(s.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Needs attention ────────────────────────────────────────────────── */}
      {attentionStores.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Needs attention</h2>
              <p className="text-xs text-stone-400 mt-0.5">Pending orders, low stock, or missing config.</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              {attentionStores.length} store{attentionStores.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-stone-100">
            {attentionStores.map((s) => <AttentionRow key={s.id} s={s} />)}
          </div>
        </div>
      )}

      {/* ── Store lifecycle ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Store lifecycle</h2>
          <Link
            href="/platform/stores"
            className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Manage all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <LifecycleCard
            label="Active"
            count={active.length}
            accent="#059669"
            stores={active}
            sub={(s) => `${s.orderCount} orders · ${s.lastOrderAt ? relativeDay(s.lastOrderAt) : ''}`}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
          />
          <LifecycleCard
            label="Growing"
            count={growing.length}
            accent="#0891b2"
            stores={growing}
            sub={(s) => `last order ${s.lastOrderAt ? relativeDay(s.lastOrderAt) : ''}`}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            }
          />
          <LifecycleCard
            label="Dormant"
            count={dormant.length}
            accent="#d97706"
            stores={dormant}
            sub={(s) => `went quiet ${s.lastOrderAt ? relativeDay(s.lastOrderAt) : ''}`}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 17H17.01M12 17H12.01M7 17H7.01M12 12H12.01M7 12H7.01M17 12H17.01M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
              </svg>
            }
          />
          <LifecycleCard
            label="Never ordered"
            count={never.length}
            accent="#6366f1"
            stores={never}
            sub={(_s) => 'no orders yet'}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            }
          />
        </div>
      </div>

    </div>
  );
}
