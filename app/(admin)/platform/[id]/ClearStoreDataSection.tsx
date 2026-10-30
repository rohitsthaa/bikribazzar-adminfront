'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clearStoreDataAction, getStoreClearDataImpactAction } from '../actions';

type Impact = {
  productCount: number;
  orderCount: number;
  paymentCount: number;
  customerCount: number;
  reviewCount: number;
  inventoryLogCount: number;
  financeEntryCount: number;
  contentCount: number;
};

const CLEAR_OPTIONS = [
  ['products', 'Products and categories'], ['orders', 'Orders'], ['payments', 'Customer payments'],
  ['customers', 'Customer accounts'], ['reviews', 'Product reviews'], ['inventory', 'Inventory history'],
  ['finance', 'Finance activity'], ['content', 'Other store content'],
] as const;

export default function ClearStoreDataSection({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [impact, setImpact] = useState<Impact | null>(null);
  const [impactError, setImpactError] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>(CLEAR_OPTIONS.map(([key]) => key));
  const matches = confirmation.trim() === storeName;

  useEffect(() => {
    if (!confirming || impact || impactError) return;
    getStoreClearDataImpactAction(storeId).then((result) => {
      if ('error' in result) setImpactError(result.error);
      else setImpact(result);
    });
  }, [confirming, impact, impactError, storeId]);

  function clearData() {
    if (!matches) return;
    setError('');
    startTransition(async () => {
      const result = await clearStoreDataAction(storeId, confirmation.trim(), selected);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      setConfirmation('');
      setImpact(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50/60 px-6 py-5">
      <h2 className="text-sm font-semibold text-amber-950">Clear store data</h2>
        <p className="mt-1 mb-4 text-xs text-amber-900/80">
        Choose which store data to remove. Related records may also be removed to keep data consistent.
        The store, team accounts, settings and theme, payment/courier setup, and subscription billing history will remain.
        This cannot be undone.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-xl border border-amber-400 px-4 py-2 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-100"
        >
          Choose data to clear
        </button>
      ) : (
        <div className="space-y-3">
          {impactError ? (
            <div className="space-y-3">
              <p role="alert" className="text-xs text-red-700">Could not load the reset preview: {impactError}</p>
              <button type="button" onClick={() => { setConfirming(false); setImpactError(''); }} className="px-2 py-1.5 text-xs text-stone-600 hover:text-stone-900">Cancel</button>
            </div>
          ) : !impact ? (
            <p className="text-xs text-stone-600">Checking what will be cleared…</p>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3">
                <p className="text-xs font-medium text-stone-800">Select data to clear:</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CLEAR_OPTIONS.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-stone-700">
                      <input type="checkbox" checked={selected.includes(key)} onChange={(event) => setSelected((old) => event.target.checked ? [...old, key] : old.filter((item) => item !== key))} />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs font-medium text-stone-800">Current amounts:</p>
                <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-stone-600 sm:grid-cols-2">
                  <li>{impact.productCount} products and variants</li>
                  <li>{impact.orderCount} orders and {impact.paymentCount} customer payments</li>
                  <li>{impact.customerCount} customer accounts</li>
                  <li>{impact.reviewCount} product reviews</li>
                  <li>{impact.inventoryLogCount} inventory records</li>
                  <li>{impact.financeEntryCount} finance entries</li>
                  <li>{impact.contentCount} other content records</li>
                </ul>
                <p className="mt-2 text-[11px] text-stone-500">Team logins, store configuration, and billing history are retained.</p>
              </div>
              <div>
                <label htmlFor="clear-store-confirm" className="mb-1.5 block text-xs text-amber-950">
                  Type <strong>{storeName}</strong> to confirm.
                </label>
                <input
                  id="clear-store-confirm"
                  type="text"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoFocus
                  className="w-full max-w-sm rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  placeholder={storeName}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearData}
                  disabled={pending || !matches}
                  className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? 'Clearing…' : 'Yes, clear selected data'}
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirming(false); setConfirmation(''); setError(''); setImpactError(''); }}
                  disabled={pending}
                  className="px-2 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    </section>
  );
}
