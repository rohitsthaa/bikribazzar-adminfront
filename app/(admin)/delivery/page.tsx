import Link from 'next/link';
import { getOrders, getSettings, type Order } from '@/lib/api';

export const metadata = { title: 'Delivery Schedule — Soul Thread Admin' };

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-amber-100 text-amber-700',
  shipped:   'bg-purple-100 text-purple-700',
};

export default async function DeliveryPage() {
  let orders: Order[] = [];
  let currency = 'NPR';

  try {
    await Promise.all([
      getOrders().then((o) => { orders = o; }),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
  } catch {}

  // Only show orders that need delivery (confirmed or shipped, not cancelled/delivered)
  const active = orders.filter((o) => o.status === 'confirmed' || o.status === 'shipped');

  // Group by delivery area (null/empty → "No area specified")
  const grouped = new Map<string, Order[]>();
  for (const order of active) {
    const area = order.deliveryArea || 'No area specified';
    if (!grouped.has(area)) grouped.set(area, []);
    grouped.get(area)!.push(order);
  }

  // Sort areas: known areas first, "No area specified" last
  const sortedAreas = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'No area specified') return 1;
    if (b === 'No area specified') return -1;
    return a.localeCompare(b);
  });

  const TZ = 'Asia/Kathmandu';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric', month: 'short' });

  return (
    <main className="p-6 md:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Delivery Schedule</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {active.length} order{active.length !== 1 ? 's' : ''} awaiting delivery — grouped by area
        </p>
      </div>

      {active.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p className="font-semibold text-stone-900">All clear</p>
          <p className="text-sm text-stone-400 mt-1">No confirmed or shipped orders pending delivery.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedAreas.map((area) => {
            const areaOrders = grouped.get(area)!.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return (
              <div key={area} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 bg-stone-50 border-b border-stone-100">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400 shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <h2 className="font-semibold text-stone-800">{area}</h2>
                  <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                    {areaOrders.length} order{areaOrders.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-stone-100">
                  {areaOrders.map((order) => {
                    const itemCount = (order.items as Array<{ quantity: number }>)
                      ?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                    return (
                      <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-medium text-stone-900 hover:text-[#c96a3a] transition-colors"
                            >
                              {order.customerName}
                            </Link>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-500'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-stone-400 flex-wrap">
                            <span>#{order.id}</span>
                            <span>·</span>
                            <span>{fmt(order.createdAt)}</span>
                            {order.phone && (
                              <>
                                <span>·</span>
                                <a
                                  href={`tel:${order.phone}`}
                                  className="hover:text-stone-700 transition-colors"
                                >
                                  {order.phone}
                                </a>
                              </>
                            )}
                            {order.address && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-xs">{order.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-stone-800">{currency} {order.totalNpr.toLocaleString()}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
