'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteStoreAction, restoreStoreAction, getStoreDeletionImpactAction } from '../actions';

type Props = {
  storeId: string;
  storeName: string;
  isDeleted: boolean;
  deletedAt: string | null;
  previousId: string | null;
};

export default function DeleteStoreSection({ storeId, storeName, isDeleted, deletedAt, previousId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [impact, setImpact] = useState<{ productCount: number; orderCount: number } | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Fetch product/order counts only once the admin actually starts the delete
  // flow — no need to hit the API just for having the page open.
  useEffect(() => {
    if (!confirming || impact) return;
    setLoadingImpact(true);
    getStoreDeletionImpactAction(storeId)
      .then((res) => setImpact('error' in res ? { productCount: 0, orderCount: 0 } : res))
      .finally(() => setLoadingImpact(false));
  }, [confirming, impact, storeId]);

  function handleDelete() {
    setError('');
    startTransition(async () => {
      const result = await deleteStoreAction(storeId);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      // The store's slug was renamed to an archived id — this page (keyed on
      // the old id) no longer exists, so follow the store to its new url.
      router.push(`/platform/${result.newId}`);
    });
  }

  function handleRestore() {
    setError('');
    startTransition(async () => {
      const result = await restoreStoreAction(storeId);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (isDeleted) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">This store is deleted</h2>
            <p className="text-xs text-stone-500 mt-1">
              Hidden from the platform list and unreachable on the storefront since{' '}
              {deletedAt ? new Date(deletedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'}.
              {' '}All its data (products, orders, settings) is untouched.
              {previousId && (
                <> Its slug <strong>{previousId}</strong> was freed up and may already be in use by another store — restoring keeps this archived id rather than reclaiming it.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestore}
            disabled={pending}
            className="shrink-0 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {pending ? 'Restoring…' : 'Restore store'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 px-6 py-5">
      <h2 className="text-sm font-semibold text-red-900">Danger zone</h2>
      <p className="text-xs text-red-700/80 mt-1 mb-4">
        Deleting a store hides it from the platform and storefront. It's reversible (nothing is erased), but customers won't be able to
        reach it until it's restored.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="px-4 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-100 text-sm font-medium transition-colors"
        >
          Delete store
        </button>
      ) : (
        <div className="space-y-3">
          {loadingImpact ? (
            <p className="text-xs text-stone-500">Checking store data…</p>
          ) : impact && (impact.productCount > 0 || impact.orderCount > 0) ? (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-amber-800">
                <strong>{storeName}</strong> still has{' '}
                {impact.productCount > 0 && <>{impact.productCount} product{impact.productCount === 1 ? '' : 's'}</>}
                {impact.productCount > 0 && impact.orderCount > 0 && ' and '}
                {impact.orderCount > 0 && <>{impact.orderCount} order{impact.orderCount === 1 ? '' : 's'}</>}
                . You can still delete it — its data stays in the database and nothing is lost, but the storefront becomes unreachable
                until you restore it.
              </p>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Are you sure you want to delete {storeName}?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
            >
              {pending ? 'Deleting…' : 'Yes, delete store'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
    </div>
  );
}
