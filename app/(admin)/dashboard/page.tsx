import Link from 'next/link';
import { getOrders, getProducts, getSettings, type Order, type Product } from '@/lib/api';
import { RevenueChart, StatusDonut, TopProductsChart } from './DashboardCharts';
import type { RevenueDay, StatusCount, TopProduct } from './DashboardCharts';

export const metadata = { title: 'Dashboard — Soul Thread Admin' };

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', confirmed: '#f59e0b', shipped: '#a855f7',
  delivered: '#22c55e', cancelled: '#9ca3af',
};

function pct(a: number, b: number) {
  if (b === 0) return '—';
  return `${Math.round((a / b) * 100)}%`;
}

function arrow(curr: number, prev: number) {
  if (prev === 0) return null;
  const diff = Math.round(((curr - prev) / prev) * 100);
  if (diff === 0) return null;
  return { diff, up: diff > 0 };
}

export default async function DashboardPage() {
  let orders: Order[] = [];
  let allProducts: Product[] = [];
  let currency = 'NPR';

  try {
    await Promise.all([
      getOrders().then((o) => { orders = o; }).catch(() => {}),
      getProducts().then((p) => { allProducts = p; }).catch(() => {}),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
  } catch { /* show zeros */ }

  const productsCount = allProducts.length;
  const oosProducts  = allProducts.filter(p => p.stockQty !== null && p.stockQty === 0);
  const lowProducts  = allProducts.filter(p => p.stockQty !== null && p.stockQty > 0 && p.reorderPoint > 0 && p.stockQty <= p.reorderPoint);

  const now = new Date();
  const TZ = 'Asia/Kathmandu';

  // ── Date helpers ────────────────────────────────────────────────────────────
  const toKTM = (d: Date) =>
    new Date(d.toLocaleString('en-US', { timeZone: TZ }));

  const startOf = (d: Date, unit: 'month' | 'day') => {
    const k = toKTM(d);
    if (unit === 'month') return new Date(k.getFullYear(), k.getMonth(), 1);
    return new Date(k.getFullYear(), k.getMonth(), k.getDate());
  };

  const nowKTM     = toKTM(now);
  const thisMonthStart = startOf(now, 'month');
  const lastMonthStart = new Date(nowKTM.getFullYear(), nowKTM.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(nowKTM.getFullYear(), nowKTM.getMonth(), 0, 23, 59, 59);

  const inRange = (o: Order, from: Date, to?: Date) => {
    const t = new Date(o.createdAt).getTime();
    return t >= from.getTime() && (!to || t <= to.getTime());
  };

  const active = orders.filter(o => o.status !== 'cancelled');
  const thisMonth  = active.filter(o => inRange(o, thisMonthStart));
  const lastMonth  = active.filter(o => inRange(o, lastMonthStart, lastMonthEnd));

  // ── Stat values ─────────────────────────────────────────────────────────────
  const totalRevenue      = active.reduce((s, o) => s + o.totalNpr, 0);
  const totalCollected    = active.reduce((s, o) => s + (o.paidNpr ?? 0), 0);
  const totalOutstanding  = totalRevenue - totalCollected;
  const avgOrderValue     = active.length ? Math.round(totalRevenue / active.length) : 0;
  const newOrders         = orders.filter(o => o.status === 'new').length;

  const thisMonthRevenue  = thisMonth.reduce((s, o) => s + o.totalNpr, 0);
  const lastMonthRevenue  = lastMonth.reduce((s, o) => s + o.totalNpr, 0);
  const momRevenue        = arrow(thisMonthRevenue, lastMonthRevenue);
  const momOrders         = arrow(thisMonth.length, lastMonth.length);

  // ── Revenue last 30 days ─────────────────────────────────────────────────────
  const revenueByDay: RevenueDay[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(nowKTM);
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    const dayOrders = active.filter(o => inRange(o, dayStart, dayEnd));
    return {
      date: label,
      revenue: dayOrders.reduce((s, o) => s + o.totalNpr, 0),
      orders: dayOrders.length,
    };
  });

  // ── Orders by status ─────────────────────────────────────────────────────────
  const statusCounts: StatusCount[] = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => ({
    name: s,
    value: orders.filter(o => o.status === s).length,
    color: STATUS_COLORS[s],
  }));

  // ── Top products ─────────────────────────────────────────────────────────────
  const productMap = new Map<string, { revenue: number; orders: number; name: string }>();
  for (const order of active) {
    for (const item of order.items as Array<{ productId: string; quantity: number; priceNpr: number; name?: string }>) {
      const existing = productMap.get(item.productId);
      const rev = (item.priceNpr ?? 0) * (item.quantity ?? 1);
      if (existing) {
        existing.revenue += rev;
        existing.orders += 1;
      } else {
        const label = item.name ?? item.productId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        productMap.set(item.productId, { revenue: rev, orders: 1, name: label });
      }
    }
  }
  const topProducts: TopProduct[] = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Total Orders',
      value: active.length,
      sub: momOrders ? `${momOrders.up ? '↑' : '↓'} ${Math.abs(momOrders.diff)}% vs last month` : `${lastMonth.length} last month`,
      subColor: momOrders ? (momOrders.up ? 'text-green-600' : 'text-red-500') : 'text-stone-400',
      accent: 'border-blue-400',
      bg: 'bg-blue-50', fg: 'text-blue-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    },
    {
      label: 'New Orders',
      value: newOrders,
      sub: newOrders > 0 ? 'Waiting for action' : 'All caught up',
      subColor: newOrders > 0 ? 'text-amber-600' : 'text-green-600',
      accent: 'border-amber-400',
      bg: 'bg-amber-50', fg: 'text-amber-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    },
    {
      label: 'This Month',
      value: `${currency} ${thisMonthRevenue.toLocaleString()}`,
      sub: momRevenue ? `${momRevenue.up ? '↑' : '↓'} ${Math.abs(momRevenue.diff)}% vs last month` : `${thisMonth.length} orders`,
      subColor: momRevenue ? (momRevenue.up ? 'text-green-600' : 'text-red-500') : 'text-stone-400',
      accent: 'border-green-400',
      bg: 'bg-green-50', fg: 'text-green-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      label: 'Avg Order Value',
      value: `${currency} ${avgOrderValue.toLocaleString()}`,
      sub: `${active.length} active orders`,
      subColor: 'text-stone-400',
      accent: 'border-purple-400',
      bg: 'bg-purple-50', fg: 'text-purple-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    },
    {
      label: 'Collected',
      value: `${currency} ${totalCollected.toLocaleString()}`,
      sub: `${pct(totalCollected, totalRevenue)} of total revenue`,
      subColor: 'text-stone-400',
      accent: 'border-teal-400',
      bg: 'bg-teal-50', fg: 'text-teal-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>,
    },
    {
      label: 'Outstanding',
      value: `${currency} ${totalOutstanding.toLocaleString()}`,
      sub: 'Due on delivery',
      subColor: totalOutstanding > 0 ? 'text-orange-500' : 'text-green-600',
      accent: 'border-orange-400',
      bg: 'bg-orange-50', fg: 'text-orange-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
  ];

  return (
    <main className="p-6 md:p-8 max-w-7xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border border-stone-200 border-b-2 ${s.accent} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide leading-tight">{s.label}</p>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${s.bg} ${s.fg} flex-shrink-0`}>
                {s.icon}
              </span>
            </div>
            <p className="text-xl font-bold text-stone-900 leading-tight">{s.value}</p>
            <p className={`text-xs ${s.subColor}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Revenue chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-stone-900">Revenue</h2>
              <p className="text-xs text-stone-400 mt-0.5">Last 30 days</p>
            </div>
            <span className="text-sm font-semibold text-stone-700">{currency} {totalRevenue.toLocaleString()}</span>
          </div>
          <RevenueChart data={revenueByDay} currency={currency} />
        </div>

        {/* Status donut — 1/3 width */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-stone-900">Orders by status</h2>
            <p className="text-xs text-stone-400 mt-0.5">{orders.length} total</p>
          </div>
          <StatusDonut data={statusCounts} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Top products — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-stone-900">Top products</h2>
            <p className="text-xs text-stone-400 mt-0.5">By revenue, all time</p>
          </div>
          <TopProductsChart data={topProducts} currency={currency} />
        </div>

        {/* Recent orders — 1/3 width */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Recent orders</h2>
            <Link href="/orders" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">View all →</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-stone-400 py-8 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {[...orders]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 6)
                .map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between gap-2 hover:bg-stone-50 rounded-xl px-2 py-1.5 -mx-2 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate group-hover:text-stone-900">
                        {o.customerName}
                      </p>
                      <p className="text-xs text-stone-400">#{o.id} · {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-stone-800">{currency} {o.totalNpr.toLocaleString()}</p>
                      <span className={`text-xs capitalize font-medium px-1.5 py-0.5 rounded-full ${
                        o.status === 'new' ? 'bg-blue-100 text-blue-600' :
                        o.status === 'confirmed' ? 'bg-amber-100 text-amber-600' :
                        o.status === 'shipped' ? 'bg-purple-100 text-purple-600' :
                        o.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        'bg-stone-100 text-stone-500'
                      }`}>{o.status}</span>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory alerts */}
      {(oosProducts.length > 0 || lowProducts.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-6">

          {oosProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <h2 className="font-semibold text-stone-900">Out of stock</h2>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">{oosProducts.length}</span>
              </div>
              <div className="space-y-2">
                {oosProducts.map(p => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="flex items-center justify-between hover:bg-stone-50 rounded-xl px-2 py-1.5 -mx-2 transition-colors group"
                  >
                    <span className="text-sm text-stone-800 group-hover:text-stone-900">{p.name}</span>
                    <span className="text-xs text-red-500 font-medium">Restock →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {lowProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h2 className="font-semibold text-stone-900">Low stock</h2>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{lowProducts.length}</span>
              </div>
              <div className="space-y-2">
                {lowProducts.map(p => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="flex items-center justify-between hover:bg-stone-50 rounded-xl px-2 py-1.5 -mx-2 transition-colors group"
                  >
                    <span className="text-sm text-stone-800 group-hover:text-stone-900">{p.name}</span>
                    <span className="text-xs text-amber-600 font-medium">{p.stockQty} left →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </main>
  );
}
