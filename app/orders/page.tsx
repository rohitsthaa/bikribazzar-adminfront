import Link from 'next/link';
import Nav from '@/components/Nav';
import { getOrders, type Order } from '@/lib/api';

export const metadata = {
  title: 'Orders',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default async function OrdersPage() {
  let orders: Order[] = [];
  let error: string | null = null;

  try {
    orders = await getOrders();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load orders';
  }

  // Sort by newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Orders</h1>
          <div className="text-sm text-gray-500">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {orders.length === 0 ? (
            <p className="text-center text-gray-400 py-16 text-sm">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const statusColor = statusColors[order.status] || statusColors.new;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">#{order.id}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{order.totalNpr.toLocaleString()} NPR</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs break-all">{order.email}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        NPR {order.totalNpr.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{date}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
