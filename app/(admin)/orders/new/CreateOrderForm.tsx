'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, OrderSource } from '@/lib/api';
import { createAdminOrderAction } from '../actions';

const SOURCES: Array<{ value: OrderSource; label: string; icon: string; color: string }> = [
  { value: 'whatsapp',  label: 'WhatsApp',  icon: '💬', color: 'bg-green-50 border-green-300 text-green-800 ring-green-400' },
  { value: 'tiktok',   label: 'TikTok',    icon: '🎵', color: 'bg-pink-50 border-pink-300 text-pink-800 ring-pink-400' },
  { value: 'instagram',label: 'Instagram', icon: '📸', color: 'bg-purple-50 border-purple-300 text-purple-800 ring-purple-400' },
  { value: 'phone',    label: 'Phone',     icon: '📞', color: 'bg-blue-50 border-blue-300 text-blue-800 ring-blue-400' },
  { value: 'walkin',   label: 'Walk-in',   icon: '🚶', color: 'bg-amber-50 border-amber-300 text-amber-800 ring-amber-400' },
  { value: 'website',  label: 'Website',   icon: '🌐', color: 'bg-stone-50 border-stone-300 text-stone-800 ring-stone-400' },
  { value: 'other',    label: 'Other',     icon: '📋', color: 'bg-stone-50 border-stone-300 text-stone-700 ring-stone-400' },
];

type LineItem = { productId: string; quantity: number; priceNpr: number };

interface Props {
  products: Product[];
  currency: string;
}

export default function CreateOrderForm({ products, currency }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [source, setSource] = useState<OrderSource>('whatsapp');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1, priceNpr: 0 }]);
  const [error, setError] = useState<string | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'productId') {
        const p = productMap.get(value as string);
        next[idx].priceNpr = p?.priceNpr ?? 0;
      }
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: '', quantity: 1, priceNpr: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((s, i) => s + (i.priceNpr * i.quantity), 0);
  const validItems = items.filter((i) => i.productId && i.quantity > 0 && i.priceNpr >= 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Customer name is required.'); return; }
    if (validItems.length === 0) { setError('Add at least one product.'); return; }

    startTransition(async () => {
      const result = await createAdminOrderAction({
        customerName: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        source,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          priceNpr: i.priceNpr,
        })),
      });
      if (result && 'error' in result) {
        setError(result.error);
      }
      // On success, createAdminOrderAction redirects — no extra navigation needed
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Source chips */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-3">Order source</h2>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSource(s.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                source === s.value
                  ? `${s.color} ring-2 shadow-sm`
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Customer</h2>

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Delivery address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Budanilkantha, Kathmandu"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or notes"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Items</h2>

        {items.map((item, idx) => (
          <div key={idx} className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              {idx === 0 && <label className="block text-xs font-medium text-stone-500 mb-1">Product</label>}
              <select
                value={item.productId}
                onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-20 flex-shrink-0">
              {idx === 0 && <label className="block text-xs font-medium text-stone-500 mb-1">Qty</label>}
              <input
                type="number"
                min={1}
                max={99}
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 text-center focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              />
            </div>

            <div className="w-28 flex-shrink-0">
              {idx === 0 && <label className="block text-xs font-medium text-stone-500 mb-1">Price ({currency})</label>}
              <input
                type="number"
                min={0}
                value={item.priceNpr}
                onChange={(e) => updateItem(idx, 'priceNpr', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 text-right focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              />
            </div>

            <div className="flex-shrink-0 pb-0.5">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="w-9 h-10 flex items-center justify-center rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mt-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add item
        </button>

        {total > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-stone-100 mt-2">
            <span className="text-sm font-medium text-stone-600">Order total</span>
            <span className="text-lg font-bold text-stone-900">{currency} {total.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {isPending ? (
            <>
              <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" strokeOpacity="0.25" strokeWidth="2.5" />
                <path d="M12 3a9 9 0 019 9" strokeWidth="2.5" />
              </svg>
              Creating…
            </>
          ) : (
            'Create order'
          )}
        </button>
        <a
          href="/orders"
          className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
        >
          Cancel
        </a>
      </div>

    </form>
  );
}
