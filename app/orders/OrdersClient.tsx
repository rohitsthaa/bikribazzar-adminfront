'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Order } from '@/lib/api';

const ALL_TABS = ['all', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type Tab = (typeof ALL_TABS)[number];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function OrdersClient({ orders }: { orders: Order[] }) {
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
      <div className="flex gap-1 flex-wrap mb-5">
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
                <th className="text-left px-5 py-3 font-medium text-stone-500 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((order) => {
                const date = new Date(order.createdAt).toLocaleDateString('en-US', {
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
                      NPR {order.totalNpr.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${color}`}>
                        {order.status}
                      </span>
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
