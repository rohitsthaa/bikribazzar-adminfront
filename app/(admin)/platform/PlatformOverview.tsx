import Link from 'next/link';
import type { PlatformOverview as Data } from '@/lib/api';
import { enterStore } from '../store-actions';

const TZ = 'Asia/Kathmandu';
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short' }) : '—';
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-US', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-amber-50 text-amber-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-stone-100 text-stone-500',
};

export default function PlatformOverview({ data }: { data: Data }) {
  const { totals, stores, recent } = data;
  const money = (n: number) => `NPR ${n.toLocaleString()}`;
  const nameOf = (id: string) => stores.find((s) => s.id === id)?.name ?? id;

  return (
    <section className="space-y-6">
      {/* Headline totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stores', value: `${totals.stores}`, sub: `${totals.active} active · ${totals.suspended} suspended` },
          { label: 'Orders (all stores)', value: totals.orders.toLocaleString() },
          { label: 'Revenue (all stores)', value: money(totals.revenue) },
          { label: 'Avg / store', value: money(totals.stores ? Math.round(totals.revenue / totals.stores) : 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-xs text-stone-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Per-store breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900 text-sm uppercase tracking-wide">Stores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="px-5 py-2.5 font-medium">Store</th>
                <th className="px-3 py-2.5 font-medium text-right">Orders</th>
                <th className="px-3 py-2.5 font-medium text-right">Revenue</th>
                <th className="px-3 py-2.5 font-medium text-right">Last order</th>
                <th className="px-3 py-2.5 font-medium">Attention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stores.map((s) => {
                const flags: string[] = [];
                if (s.pending > 0) flags.push(`${s.pending} pending`);
                if (s.lowStock > 0) flags.push(`${s.lowStock} low stock`);
                if (!s.hasPaymentConfig) flags.push('no payment config');
                return (
                  <tr key={s.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      {/* Primary action: ENTER the store (sets context → its dashboard). */}
                      <form action={enterStore.bind(null, s.id)} className="inline">
                        <button type="submit" className="font-medium text-stone-900 hover:text-[#c96a3a]">
                          {s.name}
                        </button>
                      </form>
                      {s.status !== 'active' && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{s.status}</span>
                      )}
                      {/* Secondary: provisioning (templates, payments, admins). */}
                      <Link href={`/platform/${s.id}`} className="ml-2 text-xs text-stone-400 hover:text-stone-700">
                        settings
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right text-stone-700">{s.orderCount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-medium text-stone-800">{money(s.revenue)}</td>
                    <td className="px-3 py-3 text-right text-stone-500">{fmtDate(s.lastOrderAt)}</td>
                    <td className="px-3 py-3">
                      {flags.length ? (
                        <span className="inline-flex flex-wrap gap-1">
                          {flags.map((f) => (
                            <span key={f} className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">{f}</span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900 text-sm uppercase tracking-wide">Recent activity</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-400">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {recent.map((o) => (
              <li key={`${o.storeId}-${o.id}`} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">{nameOf(o.storeId)}</span>
                <span className="text-stone-800 flex-1 min-w-0 truncate">#{o.id} · {o.customerName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-stone-100 text-stone-500'}`}>{o.status}</span>
                <span className="font-medium text-stone-800 w-24 text-right">{money(o.totalNpr)}</span>
                <span className="text-xs text-stone-400 w-24 text-right">{fmtDateTime(o.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
