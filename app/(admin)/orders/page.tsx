import Link from 'next/link';
import { getOrders, getSettings, type Order } from '@/lib/api';
import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'Orders — Soul Thread Admin',
};

export default async function OrdersPage() {
  let orders: Order[] = [];
  let error: string | null = null;
  let currency = 'NPR';

  try {
    [orders] = await Promise.all([
      getOrders(),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load orders';
  }

  // Sort by newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

      <OrdersClient orders={orders} currency={currency} />
    </main>
  );
}
