'use client';

import { useActionState, useTransition } from 'react';
import type { Coupon } from '@/lib/api';
import { addCoupon, toggleCoupon, removeCoupon } from './actions';

type Props = {
  coupons: Coupon[];
};

const INITIAL = { error: undefined } as { error?: string };

function formatExpiry(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export default function CouponsClient({ coupons }: Props) {
  const [state, formAction, pending] = useActionState(addCoupon, INITIAL);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-base font-semibold text-stone-900 mb-4">New coupon</h2>
        <form action={formAction} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Code */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Code *</label>
            <input
              name="code"
              type="text"
              placeholder="SOUL10"
              maxLength={30}
              required
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Type *</label>
            <select
              name="type"
              required
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            >
              <option value="percentage">Percentage %</option>
              <option value="fixed">Fixed NPR</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Value *</label>
            <input
              name="value"
              type="number"
              min={1}
              placeholder="10"
              required
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          {/* Uses left */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Uses (blank = unlimited)</label>
            <input
              name="usesLeft"
              type="number"
              min={1}
              placeholder="—"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          {/* Min order */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Min order (NPR)</label>
            <input
              name="minOrderNpr"
              type="number"
              min={0}
              defaultValue={0}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Expires (optional)</label>
            <input
              name="expiresAt"
              type="date"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          {/* Submit + error */}
          <div className="col-span-2 sm:col-span-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 rounded-lg bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] transition-colors disabled:opacity-50"
            >
              {pending ? 'Creating…' : 'Create coupon'}
            </button>
            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
          </div>
        </form>
      </div>

      {/* Coupons list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">No coupons yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Min order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Uses left</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {coupons.map((c) => {
                const expired = isExpired(c.expiresAt);
                const depleted = c.usesLeft !== null && c.usesLeft <= 0;
                const effectivelyInactive = !c.active || expired || depleted;

                return (
                  <tr key={c.code} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-900 tracking-wider">{c.code}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {c.type === 'percentage' ? `${c.value}%` : `NPR ${c.value.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {c.minOrderNpr > 0 ? `NPR ${c.minOrderNpr.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {c.usesLeft === null ? '∞' : (
                        <span className={c.usesLeft === 0 ? 'text-red-500 font-medium' : ''}>{c.usesLeft}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={expired ? 'text-red-500' : 'text-stone-500'}>
                        {formatExpiry(c.expiresAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {effectivelyInactive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                          {expired ? 'Expired' : depleted ? 'Depleted' : 'Inactive'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => startTransition(() => toggleCoupon(c.code, !c.active))}
                          className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          {c.active ? 'Disable' : 'Enable'}
                        </button>
                        <span className="text-stone-200">|</span>
                        <button
                          onClick={() => {
                            if (confirm(`Delete coupon "${c.code}"?`)) {
                              startTransition(() => removeCoupon(c.code));
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
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
