import Link from 'next/link';
import Nav from '@/components/Nav';
import { getOrders, getProducts, type Order } from '@/lib/api';

export const metadata = { title: 'Dashboard — Soul Thread Admin' };

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default async function DashboardPage() {
  let orders: Order[] = [];
  let productsCount = 0;

  try {
    [orders] = await Promise.all([
      getOrders().catch(() => [] as Order[]),
      getProducts()
        .then((p) => { productsCount = p.length; })
        .catch(() => {}),
    ]);
  } catch {
    // silently fall through to show zeros
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalNpr, 0);
  const newOrders = orders.filter((o) => o.status === 'new').length;
  const last5 = sorted.slice(0, 5);

  const statCards = [
    { label: 'Total Orders', value: orders.length },
    { label: 'New Orders', value: newOrders, highlight: newOrders > 0 },
    {
      label: 'Total Revenue',
      value: `NPR ${totalRevenue.toLocaleString()}`,
    },
    { label: 'Products', value: productsCount },
  ];

  const quickLinks = [
    { href: '/products', label: 'Manage Products', desc: 'Add, edit and sort products' },
    { href: '/gallery', label: 'View Gallery', desc: 'Upload and manage gallery images' },
    { href: '/orders', label: 'All Orders', desc: 'Browse and update order statuses' },
  ];

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500 mt-1">Welcome back to Soul Thread admin.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 ${
                card.highlight
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-white border-stone-200'
              }`}
            >
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight ${
                  card.highlight ? 'text-blue-700' : 'text-stone-900'
                }`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Recent Orders</h2>
            <Link
              href="/orders"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {last5.length === 0 ? (
              <p className="text-center text-stone-400 py-12 text-sm">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-stone-500">Order</th>
                    <th className="text-left px-5 py-3 font-medium text-stone-500">Customer</th>
                    <th className="text-right px-5 py-3 font-medium text-stone-500">Amount</th>
                    <th className="text-left px-5 py-3 font-medium text-stone-500">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-stone-500">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {last5.map((order) => {
                    const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const color = statusColors[order.status] ?? statusColors.new;
                    return (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-stone-900">#{order.id}</td>
                        <td className="px-5 py-3 text-stone-700">{order.customerName}</td>
                        <td className="px-5 py-3 text-right text-stone-900 font-medium">
                          NPR {order.totalNpr.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${color}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-stone-500 text-xs">{date}</td>
                        <td className="px-5 py-3 text-right">
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
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-semibold text-stone-900 mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((ql) => (
              <Link
                key={ql.href}
                href={ql.href}
                className="group bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-400 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-stone-900 group-hover:text-stone-700 mb-1">
                  {ql.label}
                </p>
                <p className="text-sm text-stone-500">{ql.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
