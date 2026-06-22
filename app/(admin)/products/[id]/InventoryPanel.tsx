'use client';

import { useState, useTransition } from 'react';
import type { InventoryLog, Product, ProductVariant } from '@/lib/api';
import { restockAction, adjustStockAction, restockVariantAction, adjustVariantStockAction } from '../actions';

const REASON_META: Record<string, { label: string; color: string }> = {
  sale:       { label: 'Sale',       color: 'text-red-600 bg-red-50' },
  restock:    { label: 'Restock',    color: 'text-green-700 bg-green-50' },
  adjustment: { label: 'Adjustment', color: 'text-blue-600 bg-blue-50' },
  cancelled:  { label: 'Cancelled',  color: 'text-amber-700 bg-amber-50' },
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'Asia/Kathmandu',
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Per-variant stock control row
// ---------------------------------------------------------------------------
function VariantStockRow({ productId, variant }: { productId: string; variant: ProductVariant & { id: string } }) {
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [batchDate, setBatchDate] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [tab, setTab] = useState<'restock' | 'adjust'>('restock');
  const [error, setError] = useState<string | null>(null);
  const [isPendingR, startR] = useTransition();
  const [isPendingA, startA] = useTransition();

  const stockQty = variant.stockQty;
  const isUnlimited = stockQty === null;

  function handleRestock() {
    const q = parseInt(qty);
    if (!q || q <= 0) { setError('Enter a valid quantity.'); return; }
    setError(null);
    startR(async () => {
      const res = await restockVariantAction(productId, variant.id, q, note || undefined, batchDate || undefined);
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
      const res = await adjustVariantStockAction(productId, variant.id, d, note || undefined);
      if ('error' in res) { setError(res.error); return; }
      setAdjDelta(''); setNote('');
      window.location.reload();
    });
  }

  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-stone-900">{variant.label}</span>
          {variant.sku && <span className="ml-2 text-xs text-stone-400 font-mono">{variant.sku}</span>}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isUnlimited ? 'bg-stone-100 text-stone-500' :
          stockQty === 0 ? 'bg-red-50 text-red-600' :
          'bg-green-50 text-green-700'
        }`}>
          {isUnlimited ? 'Unlimited' : stockQty === 0 ? 'Out of stock' : `${stockQty} in stock`}
        </span>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-stone-200 rounded-lg p-0.5 w-fit">
        {(['restock', 'adjust'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
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
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-stone-400" />
            <button onClick={handleRestock} disabled={isPendingR}
              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors">
              {isPendingR ? '…' : '+ Add'}
            </button>
          </div>
          <input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-stone-400" />
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Batch notes (optional)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-stone-400" />
        </div>
      )}

      {tab === 'adjust' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input type="number" value={adjDelta} onChange={e => setAdjDelta(e.target.value)}
              placeholder="e.g. -2 or +5"
              disabled={isUnlimited}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-50" />
            <button onClick={handleAdjust} disabled={isPendingA || isUnlimited}
              className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors">
              {isPendingA ? '…' : 'Apply'}
            </button>
          </div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason (optional)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-stone-400" />
          {isUnlimited && <p className="text-xs text-amber-600">Set a stock qty in the product form first.</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface Props {
  product: Product;
  logs: InventoryLog[];
  currency: string;
}

export default function InventoryPanel({ product, logs: initialLogs, currency }: Props) {
  const [logs] = useState<InventoryLog[]>(initialLogs);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restockBatchDate, setRestockBatchDate] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPendingRestock, startRestock] = useTransition();
  const [isPendingAdj, startAdj] = useTransition();
  const [tab, setTab] = useState<'restock' | 'adjust'>('restock');

  const hasVariants = (product.variants ?? []).length > 0;
  const stockQty = product.stockQty;
  const isUnlimited = stockQty === null;
  const isOOS = stockQty === 0;
  const isLow = !isOOS && !isUnlimited && product.reorderPoint > 0 && stockQty! <= product.reorderPoint;

  function handleRestock() {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) { setError('Enter a valid quantity.'); return; }
    setError(null);
    startRestock(async () => {
      const res = await restockAction(product.id, qty, restockNote || undefined, restockBatchDate || undefined);
      if ('error' in res) { setError(res.error); return; }
      setRestockQty(''); setRestockNote(''); setRestockBatchDate('');
      window.location.reload();
    });
  }

  function handleAdjust() {
    const delta = parseInt(adjDelta);
    if (isNaN(delta) || delta === 0) { setError('Enter a non-zero adjustment.'); return; }
    setError(null);
    startAdj(async () => {
      const res = await adjustStockAction(product.id, delta, adjNote || undefined);
      if ('error' in res) { setError(res.error); return; }
      setAdjDelta(''); setAdjNote('');
      window.location.reload();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-900 text-sm uppercase tracking-wide">Inventory</h2>
        {/* Product-level stock pill (hidden when variants own all stock) */}
        {!hasVariants && (
          isUnlimited ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500">Unlimited</span>
          ) : isOOS ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">Out of stock</span>
          ) : isLow ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Low: {stockQty}</span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">{stockQty} in stock</span>
          )
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Variant stock controls                                               */}
      {/* ------------------------------------------------------------------ */}
      {hasVariants && (
        <div className="space-y-3">
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Variants</p>
          {(product.variants ?? []).map((v) =>
            v.id ? (
              <VariantStockRow
                key={v.id}
                productId={product.id}
                variant={v as ProductVariant & { id: string }}
              />
            ) : null
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Product-level controls (only shown when no variants)                */}
      {/* ------------------------------------------------------------------ */}
      {!hasVariants && (
        <>
          {!isUnlimited && (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-stone-900">{stockQty}</p>
                <p className="text-xs text-stone-400 mt-0.5">In stock</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-stone-900">{product.reorderPoint}</p>
                <p className="text-xs text-stone-400 mt-0.5">Reorder at</p>
              </div>
            </div>
          )}

          <div>
            <div className="flex gap-1 mb-3 bg-stone-100 rounded-lg p-1 w-fit">
              <button onClick={() => setTab('restock')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'restock' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
                Restock
              </button>
              <button onClick={() => setTab('adjust')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'adjust' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
                Adjust
              </button>
            </div>

            {tab === 'restock' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" min={1} value={restockQty} onChange={e => setRestockQty(e.target.value)}
                    placeholder="Qty to add"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                  <button onClick={handleRestock} disabled={isPendingRestock}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                    {isPendingRestock ? '…' : '+ Add'}
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1 ml-1">Batch date</label>
                  <input type="date" value={restockBatchDate} onChange={e => setRestockBatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1 ml-1">Batch notes</label>
                  <input type="text" value={restockNote} onChange={e => setRestockNote(e.target.value)}
                    placeholder="e.g. Undyed cotton · June weave · 3mm cord"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>
              </div>
            )}

            {tab === 'adjust' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" value={adjDelta} onChange={e => setAdjDelta(e.target.value)}
                    placeholder="e.g. -2 or +5"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                  <button onClick={handleAdjust} disabled={isPendingAdj || isUnlimited}
                    title={isUnlimited ? 'Set a stock qty first' : undefined}
                    className="px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                    {isPendingAdj ? '…' : 'Apply'}
                  </button>
                </div>
                <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                {isUnlimited && (
                  <p className="text-xs text-amber-600">Set a stock qty in the product form to enable adjustments.</p>
                )}
              </div>
            )}

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        </>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Movement log</h3>
          <ol className="space-y-2">
            {logs.map((log) => {
              const meta = REASON_META[log.reason] ?? { label: log.reason, color: 'text-stone-600 bg-stone-100' };
              return (
                <li key={log.id} className="flex items-start gap-3 text-xs">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded font-medium shrink-0 ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`font-semibold ${log.delta > 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {log.delta > 0 ? `+${log.delta}` : log.delta}
                    </span>
                    {log.variantId && (
                      <span className="ml-1.5 text-stone-400 font-mono text-[10px]">
                        {(product.variants ?? []).find(v => v.id === log.variantId)?.label ?? log.variantId}
                      </span>
                    )}
                    {log.orderId && (
                      <a href={`/orders/${log.orderId}`} className="ml-1.5 text-stone-400 hover:text-stone-700 transition-colors">
                        order #{log.orderId}
                      </a>
                    )}
                    {log.batchDate && (
                      <span className="ml-1.5 text-stone-400 font-medium">batch: {log.batchDate}</span>
                    )}
                    {log.notes && <span className="ml-1.5 text-stone-400 truncate">{log.notes}</span>}
                    <p className="text-stone-300 mt-0.5">{fmt(log.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {logs.length === 0 && (
        <p className="text-xs text-stone-400 text-center py-2">No movements yet.</p>
      )}
    </div>
  );
}
