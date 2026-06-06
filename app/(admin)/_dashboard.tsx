import Link from 'next/link';
import { getOrders, getProducts, type Order } from '@/lib/api';

export const metadata = { title: 'Dashboard — Soul Thread Admin' };

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function getDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const statCards = [
    {
      label: 'Total Orders',
      value: orders.length,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      accent: 'border-b-blue-400',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
        </svg>
      ),
    },
    {
      label: 'New Orders',
      value: newOrders,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      accent: 'border-b-amber-400',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      label: 'Total Revenue',
      value: `NPR ${totalRevenue.toLocaleString()}`,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      accent: 'border-b-green-400',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      label: 'Products',
      value: productsCount,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      accent: 'border-b-purple-400',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    { href: '/products', label: 'Manage Products', desc: 'Add, edit and sort products' },
    { href: '/gallery', label: 'View Gallery', desc: 'Upload and manage gallery images' },
    { href: '/orders', label: 'All Orders', desc: 'Browse and update order statuses' },
  ];

  return (
    <main className="p-6 md:p-8 max-w-6xl space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{getDayGreeting()} 👋</h1>
        <p className="text-sm text-stone-500 mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-2xl border border-stone-200 border-b-2 ${card.accent} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                {card.label}
              </p>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-stone-900">
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

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
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
                  <th className="text-left px-5 py-3 font-medium text-stone-500 hidden md:table-cell">Date</th>
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
                      <td className="px-5 py-3 text-stone-500 text-xs hidden md:table-cell">{date}</td>
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
              className="group bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-400 hover:shadow-sm transition-all shadow-sm"
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
  );
}
