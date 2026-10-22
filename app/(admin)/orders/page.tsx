import Link from 'next/link';
import { getOrders, getSettings, type Order, type OrderCounts } from '@/lib/api';
import Pager from '@/components/Pager';
import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'Orders — Soul Thread Admin',
};

const PAGE_SIZE = 50;

// Status/page live in the URL rather than component state, so a shopkeeper can bookmark or
// share "new orders, page 2" and the back button behaves. It also means the filtered query
// runs in SQL instead of the browser holding every order the store has ever taken.
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? 'all';
  const q = sp.q ?? '';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  let orders: Order[] = [];
  let counts: OrderCounts = { all: 0, new: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  let total = 0;
  let error: string | null = null;
  let currency = 'NPR';

  try {
    const [res] = await Promise.all([
      getOrders({ status, q, page, limit: PAGE_SIZE }),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
    orders = res.items;
    counts = res.counts;
    total = res.total;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load orders';
  }
  // Already newest-first from the API; no client sort, since sorting one page of a paginated
  // list would only reorder that page and quietly imply it was the whole set.

  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Orders</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Order
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
          {error}
        </div>
      )}

      <OrdersClient orders={orders} currency={currency} counts={counts} status={status} q={q} />
          <Pager page={page} limit={PAGE_SIZE} total={total} basePath="/orders" params={{ status: status === 'all' ? undefined : status, q: q || undefined }} />
    </main>
  );
}
