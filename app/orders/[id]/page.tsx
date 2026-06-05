import Link from 'next/link';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import { getOrder } from '@/lib/api';
import type { Order } from '@/lib/api';
import { updateStatusAction } from '../actions';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

const statusOptions: Order['status'][] = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export async function generateMetadata({ params }: OrderDetailPageProps) {
  try {
    const order = await getOrder(params.id);
    return { title: `Order #${order.id}` };
  } catch {
    return { title: 'Order Not Found' };
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  let order: Order | null = null;
  let error = null;

  try {
    order = await getOrder(params.id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load order';
  }

  if (!order || error) {
    notFound();
  }

  const createdDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusColor = statusColors[order.status] || statusColors.new;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/orders"
              className="text-sm text-stone-600 hover:text-stone-900 mb-3 inline-block"
            >
              ← Back to orders
            </Link>
            <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
            <p className="text-sm text-gray-500 mt-1">{createdDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-2">Status</p>
            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium capitalize ${statusColor}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Items ({order.items.length})</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Product</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Qty</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Unit Price</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 font-medium text-gray-900">{item.productId}</td>
                      <td className="px-6 py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-3 text-right text-gray-600">NPR {item.priceNpr.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        NPR {(item.priceNpr * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-baseline">
                <span className="font-medium text-gray-600">Total</span>
                <span className="text-lg font-semibold text-gray-900">NPR {order.totalNpr.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-gray-900 break-all">
                    <a href={`mailto:${order.email}`} className="hover:text-stone-600">
                      {order.email}
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="text-gray-900">
                    <a href={`tel:${order.phone}`} className="hover:text-stone-600">
                      {order.phone}
                    </a>
                  </p>
                </div>
                {order.address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-gray-900">{order.address}</p>
                  </div>
                )}
                {order.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Changer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Change Status</h2>
              <form className="space-y-3">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    formAction={updateStatusAction.bind(null, params.id, option)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      option === order.status
                        ? 'bg-stone-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mark as {option}
                  </button>
                ))}
              </form>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
              <a
                href={`mailto:${order.email}`}
                className="block px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-center text-sm font-medium"
              >
                Email Customer
              </a>
            </div>

            {/* Meta */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-sm text-gray-600">
              <p className="mb-2">
                <span className="block font-medium text-gray-700 mb-0.5">Created</span>
                {createdDate}
              </p>
              <p>
                <span className="block font-medium text-gray-700 mb-0.5">Last updated</span>
                {new Date(order.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
