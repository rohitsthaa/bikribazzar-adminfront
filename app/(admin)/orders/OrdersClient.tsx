'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Order } from '@/lib/api';

const SOURCE_META: Record<string, { label: string; icon: string; color: string }> = {
  website:   { label: 'Web',       icon: '🌐', color: 'bg-stone-100 text-stone-500' },
  tiktok:    { label: 'TikTok',    icon: '🎵', color: 'bg-pink-50 text-pink-600' },
  instagram: { label: 'Instagram', icon: '📸', color: 'bg-purple-50 text-purple-600' },
  whatsapp:  { label: 'WhatsApp',  icon: '💬', color: 'bg-green-50 text-green-700' },
  phone:     { label: 'Phone',     icon: '📞', color: 'bg-blue-50 text-blue-600' },
  walkin:    { label: 'Walk-in',   icon: '🚶', color: 'bg-amber-50 text-amber-700' },
  other:     { label: 'Other',     icon: '📋', color: 'bg-stone-100 text-stone-500' },
};

const ALL_TABS = ['all', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type Tab = (typeof ALL_TABS)[number];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function exportCsv(orders: Order[], label: string) {
  const header = ['Order ID', 'Customer', 'Email', 'Phone', 'Address', 'Notes', 'Items', 'Total (NPR)', 'Paid (NPR)', 'Payment method', 'Status', 'Date'];
  const rows = orders.map((o) => [
    `#${o.id}`,
    o.customerName,
    o.email,
    o.phone,
    o.address ?? '',
    o.notes ?? '',
    o.items.map((i) => `${i.name ?? i.productId}${i.variantLabel ? ` (${i.variantLabel})` : ''} ×${i.quantity}`).join('; '),
    o.totalNpr,
    o.paidNpr ?? 0,
    o.paymentMethod ?? '',
    o.status,
    new Date(o.createdAt).toLocaleDateString('en-US'),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soul-thread-orders-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersClient({ orders, currency = 'NPR' }: { orders: Order[]; currency?: string }) {
  const [tab, setTab] = useState<Tab>('all');

  const counts: Record<Tab, number> = {
    all: orders.length,
    new: orders.filter((o) => o.status === 'new').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="flex gap-1 flex-wrap">
          {ALL_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-stone-800 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              {t}
              <span className={`ml-1.5 text-xs ${tab === t ? 'text-stone-300' : 'text-stone-400'}`}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCsv(filtered, tab)}
          className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-stone-400 py-16 text-sm">No orders in this category.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-stone-500">Order</th>
                <th className="text-left px-5 py-3 font-medium text-stone-500">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-stone-500 hidden md:table-cell">Email</th>
                <th className="text-right px-5 py-3 font-medium text-stone-500">Total</th>
                <th className="text-left px-5 py-3 font-medium text-stone-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-stone-500 hidden lg:table-cell">Source</th>
                <th className="text-left px-5 py-3 font-medium text-stone-500 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((order) => {
                const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                  timeZone: 'Asia/Kathmandu',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const color = statusColors[order.status] ?? statusColors.new;
                return (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-stone-900">#{order.id}</div>
                    </td>
                    <td className="px-5 py-3 text-stone-700">{order.customerName}</td>
                    <td className="px-5 py-3 text-stone-500 text-xs hidden md:table-cell break-all">
                      {order.email}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-stone-900">
                      {currency} {order.totalNpr.toLocaleString()}
                      {order.paymentMethod === 'esewa' && (
                        <span className="block mt-0.5 text-[10px] font-medium text-green-600">● Paid · eSewa</span>
                      )}
                      {order.paymentMethod === 'khalti' && (
                        <span className="block mt-0.5 text-[10px] font-medium text-purple-600">● Paid · Khalti</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${color}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      {(() => {
                        const s = SOURCE_META[order.source ?? 'website'] ?? SOURCE_META.other;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                            <span className="text-[10px]">{s.icon}</span>
                            {s.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3 text-stone-500 text-xs hidden sm:table-cell">{date}</td>
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
  );
}
