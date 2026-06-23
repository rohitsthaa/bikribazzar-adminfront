import Link from 'next/link';
import type { PlatformOverview as Data } from '@/lib/api';
import { enterStore } from '../store-actions';

const TZ = 'Asia/Kathmandu';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short' }) : '—';

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });

const money = (n: number) => `NPR ${n.toLocaleString()}`;

const STATUS_BADGE: Record<string, string> = {
  new:       'bg-blue-50 text-blue-700',
  confirmed: 'bg-amber-50 text-amber-700',
  shipped:   'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-stone-100 text-stone-500',
};

const TEMPLATE_LABEL: Record<string, string> = {
  soulthread: 'Soul Thread',
  aurora:     'Aurora',
  bloom:      'Bloom',
  coastal:    'Coastal',
};

export default function PlatformOverview({ data }: { data: Data }) {
  const { totals, stores, recent } = data;
  const nameOf = (id: string) => stores.find((s) => s.id === id)?.name ?? id;

  // ── Stat cards ──────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Total stores',
      value: totals.stores.toString(),
      sub: `${totals.active} active${totals.suspended ? ` · ${totals.suspended} suspended` : ''}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: 'All-time orders',
      value: totals.orders.toLocaleString(),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
        </svg>
      ),
    },
    {
      label: 'Total revenue',
      value: money(totals.revenue),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      label: 'Avg per store',
      value: money(totals.stores ? Math.round(totals.revenue / totals.stores) : 0),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-400">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{s.value}</p>
            <p className="text-xs text-stone-400 mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-stone-400">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Stores table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-900">Stores</h2>
          <span className="text-xs text-stone-400">{stores.length} total</span>
        </div>

        {stores.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-stone-400">No stores yet — create one above.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {stores.map((s) => {
              const flags: string[] = [];
              if (s.pending > 0) flags.push(`${s.pending} pending`);
              if (s.lowStock > 0) flags.push(`${s.lowStock} low stock`);
              if (!s.hasPaymentConfig) flags.push('no payment config');

              return (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/70 transition-colors">
                  {/* Store identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-900">{s.name}</span>
                      {s.status !== 'active' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium uppercase tracking-wide">
                          {s.status}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
                        {TEMPLATE_LABEL[s.templateId] ?? s.templateId}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{s.id}</p>
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {flags.map((f) => (
                          <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{s.orderCount.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">orders</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{money(s.revenue)}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">revenue</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">{fmtDate(s.lastOrderAt)}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">last order</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/platform/${s.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 border border-stone-200 hover:bg-stone-50 hover:text-stone-800 transition-colors"
                    >
                      Config
                    </Link>
                    <form action={enterStore.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#c96a3a] hover:bg-[#b85f33] transition-colors"
                      >
                        Enter →
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent activity ───────────────────────────────────────────── */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">Recent orders</h2>
          </div>
          <ul className="divide-y divide-stone-100">
            {recent.map((o) => (
              <li key={`${o.storeId}-${o.id}`} className="flex items-center gap-3 px-6 py-3">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium flex-shrink-0">
                  {nameOf(o.storeId)}
                </span>
                <span className="text-sm text-stone-700 flex-1 min-w-0 truncate">
                  #{o.id} · {o.customerName}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[o.status] ?? 'bg-stone-100 text-stone-500'}`}>
                  {o.status}
                </span>
                <span className="text-sm font-medium text-stone-800 flex-shrink-0 hidden sm:block">
                  {money(o.totalNpr)}
                </span>
                <span className="text-xs text-stone-400 flex-shrink-0 hidden md:block w-28 text-right">
                  {fmtDateTime(o.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
