import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrders, getSettings, type Order } from '@/lib/api';

export const metadata = { title: 'Customer — Soul Thread Admin' };

const TZ = 'Asia/Kathmandu';
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-amber-50 text-amber-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-stone-100 text-stone-500',
};

export default async function CustomerProfilePage({ params }: { params: { key: string } }) {
  const key = decodeURIComponent(params.key);

  let orders: Order[] = [];
  let currency = 'NPR';
  try {
    await Promise.all([
      getOrders().then((o) => { orders = o; }),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
  } catch {}

  // All orders belonging to this customer (matched on email, falling back to phone).
  const theirs = orders
    .filter((o) => (o.email || o.phone) === key)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (theirs.length === 0) notFound();

  const latest = theirs[0];
  const active = theirs.filter((o) => o.status !== 'cancelled');
  const totalSpend = active.reduce((s, o) => s + o.totalNpr, 0);
  const totalPaid = active.reduce((s, o) => s + (o.paidNpr ?? 0), 0);
  const areas = Array.from(new Set(theirs.map((o) => o.deliveryArea).filter(Boolean))) as string[];
  const firstOrderAt = theirs[theirs.length - 1].createdAt;

  const money = (n: number) => `${currency} ${n.toLocaleString()}`;

  return (
    <main className="p-6 md:p-8 max-w-4xl space-y-6">
      <Link href="/customers" className="text-sm text-stone-500 hover:text-stone-900">← Customers</Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-stone-800 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
          {latest.customerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-stone-900">{latest.customerName}</h1>
            {active.length > 1 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                {active.length}× buyer
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 flex-wrap">
            {latest.email && <a href={`mailto:${latest.email}`} className="hover:text-stone-900">{latest.email}</a>}
            {latest.email && latest.phone && <span>·</span>}
            {latest.phone && <a href={`tel:${latest.phone}`} className="hover:text-stone-900">{latest.phone}</a>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Orders', value: active.length },
          { label: 'Total spend', value: money(totalSpend) },
          { label: 'Total paid', value: money(totalPaid) },
          { label: 'Customer since', value: fmtDate(firstOrderAt) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-lg font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {areas.length > 0 && (
        <div className="text-sm text-stone-500">
          <span className="text-xs uppercase tracking-wide text-stone-400 font-medium">Delivery areas · </span>
          {areas.join(', ')}
        </div>
      )}

      {/* Order history */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900 text-sm uppercase tracking-wide">Order history</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {theirs.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900">Order #{o.id}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {fmtDate(o.createdAt)}
                  {o.deliveryArea ? ` · ${o.deliveryArea}` : ''}
                  {` · ${o.items.length} item${o.items.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[o.status] ?? 'bg-stone-100 text-stone-500'}`}>
                {o.status}
              </span>
              <p className="font-semibold text-stone-800 w-24 text-right">{money(o.totalNpr)}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
