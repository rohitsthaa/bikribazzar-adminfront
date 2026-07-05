import Link from 'next/link';
import { getOrders, getSettings, type Order } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

export const metadata = { title: 'Customers — Soul Thread Admin' };

type Customer = {
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string;
  lastOrderId: number;
  firstOrderAt: string;
  areas: string[];
};

function buildCustomers(orders: Order[]): Customer[] {
  // Key by email (fallback: phone) to merge repeat customers
  const map = new Map<string, Customer>();

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const key = o.email || o.phone;
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpend += o.totalNpr;
      if (new Date(o.createdAt) > new Date(existing.lastOrderAt)) {
        existing.lastOrderAt = o.createdAt;
        existing.lastOrderId = o.id;
      }
      if (new Date(o.createdAt) < new Date(existing.firstOrderAt)) {
        existing.firstOrderAt = o.createdAt;
      }
      if (o.deliveryArea && !existing.areas.includes(o.deliveryArea)) {
        existing.areas.push(o.deliveryArea);
      }
    } else {
      map.set(key, {
        name: o.customerName,
        email: o.email,
        phone: o.phone,
        orderCount: 1,
        totalSpend: o.totalNpr,
        lastOrderAt: o.createdAt,
        lastOrderId: o.id,
        firstOrderAt: o.createdAt,
        areas: o.deliveryArea ? [o.deliveryArea] : [],
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  );
}

export default async function CustomersPage() {
  let orders: Order[] = [];
  let currency = 'NPR';

  try {
    await Promise.all([
      getOrders().then((o) => { orders = o; }),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
  } catch {}

  const customers = buildCustomers(orders);

  const TZ = 'Asia/Kathmandu';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main className="p-6 md:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Customers</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {customers.length} unique buyer{customers.length !== 1 ? 's' : ''} · from active orders
        </p>
      </div>

      {/* Summary stats */}
      {customers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total customers',
              value: customers.length,
              icon: '👥',
            },
            {
              label: 'Repeat buyers',
              value: customers.filter((c) => c.orderCount > 1).length,
              icon: '🔄',
            },
            {
              label: 'Avg order value',
              value: `${currency} ${Math.round(orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalNpr, 0) / Math.max(orders.filter(o => o.status !== 'cancelled').length, 1)).toLocaleString()}`,
              icon: '💰',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState
            className="border-0 rounded-none py-12"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
            title="No customers yet"
            body="Customers are built from your orders — they'll show up here once the first one comes in."
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {customers.map((c) => (
              <Link
                key={c.email || c.phone}
                href={`/customers/${encodeURIComponent(c.email || c.phone)}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-stone-900 group-hover:text-[#c96a3a] transition-colors">{c.name}</p>
                    {c.orderCount > 1 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                        {c.orderCount}× buyer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400 flex-wrap">
                    {c.email && <span>{c.email}</span>}
                    {c.email && c.phone && <span>·</span>}
                    {c.phone && <span>{c.phone}</span>}
                    {c.areas.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{c.areas.slice(0, 2).join(', ')}{c.areas.length > 2 ? ` +${c.areas.length - 2}` : ''}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-stone-800">{currency} {c.totalSpend.toLocaleString()}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Last order {fmt(c.lastOrderAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
