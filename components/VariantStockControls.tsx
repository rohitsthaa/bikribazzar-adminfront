'use client';

import { useState, useTransition } from 'react';
import { restockVariantAction, adjustVariantStockAction } from '@/app/(admin)/products/actions';

// Restock/Adjust mini-form for a single persisted variant. Lives inline in the
// Variants tab (components/ProductForm.tsx) so stock is managed in the same
// place it's displayed, instead of a separate Inventory sidebar card — see
// that file's Variants tab for the surrounding row/header markup.
export default function VariantStockControls({
  productId, variantId, stockQty,
}: { productId: string; variantId: string; stockQty: number | null }) {
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [batchDate, setBatchDate] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [tab, setTab] = useState<'restock' | 'adjust'>('restock');
  const [error, setError] = useState<string | null>(null);
  const [isPendingR, startR] = useTransition();
  const [isPendingA, startA] = useTransition();

  const isUnlimited = stockQty === null;

  function handleRestock() {
    const q = parseInt(qty);
    if (!q || q <= 0) { setError('Enter a valid quantity.'); return; }
    setError(null);
    startR(async () => {
      const res = await restockVariantAction(productId, variantId, q, note || undefined, batchDate || undefined);
      if ('error' in res) { setError(res.error); return; }
      setQty(''); setNote(''); setBatchDate('');
      window.location.reload();
    });
  }

  function handleAdjust() {
    const d = parseInt(adjDelta);
    if (isNaN(d) || d === 0) { setError('Enter a non-zero value.'); return; }
    setError(null);
    startA(async () => {
      const res = await adjustVariantStockAction(productId, variantId, d, note || undefined);
      if ('error' in res) { setError(res.error); return; }
      setAdjDelta(''); setNote('');
      window.location.reload();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-3">
      <div className="flex gap-1 bg-stone-200 rounded-lg p-0.5 w-fit">
        {(['restock', 'adjust'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'restock' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)}
              placeholder="Qty to add"
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
            <button type="button" onClick={handleRestock} disabled={isPendingR}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isPendingR ? '…' : '+ Add'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Batch notes (optional)"
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
          </div>
        </div>
      )}

      {tab === 'adjust' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input type="number" value={adjDelta} onChange={e => setAdjDelta(e.target.value)}
              placeholder="e.g. -2 or +5"
              disabled={isUnlimited}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50" />
            <button type="button" onClick={handleAdjust} disabled={isPendingA || isUnlimited}
              className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isPendingA ? '…' : 'Apply'}
            </button>
          </div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason (optional)"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
          {isUnlimited && <p className="text-xs text-amber-600">This variant has unlimited stock — nothing to adjust.</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
