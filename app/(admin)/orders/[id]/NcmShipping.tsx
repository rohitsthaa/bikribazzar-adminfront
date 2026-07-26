'use client';

import { useState, useTransition } from 'react';
import { getNcmBranchesAction, getNcmShippingRateAction, shipViaNcmAction, syncNcmStatusAction } from '../actions';
import type { NcmBranch } from '@/lib/api';

// Matches NcmService.ResolveBaseUrl's own default on the API side — every store currently
// resolves to NCM's demo/UAT host (NCM_BASE_URL is unset everywhere so far). If a real store
// ever gets pointed at NCM's production host via that env var, this link would need the actual
// per-store base URL threaded down from the server instead of this hardcoded default.
const NCM_PORTAL_BASE_URL = 'https://demo.nepalcanmove.com';

export default function NcmShipping({
  orderId,
  ncmOrderId,
  ncmDestinationBranch,
  ncmTrackingStatus,
  remainingNpr,
}: {
  orderId: string;
  ncmOrderId?: number | null;
  ncmDestinationBranch?: string | null;
  ncmTrackingStatus?: string | null;
  remainingNpr: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<NcmBranch[] | null>(null);
  const [toBranch, setToBranch] = useState('');
  const [cod, setCod] = useState(remainingNpr > 0);
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  function handleBranchChange(next: string) {
    setToBranch(next);
    setCharge(null);
    setRateError(null);
    if (!next) return;
    setRateLoading(true);
    // Fire-and-forget, deliberately outside the shared isPending transition — this is an
    // advisory preview (NCM's own quoted delivery charge for this branch/type), not something
    // the ship action depends on, so it shouldn't disable Confirm while it loads.
    getNcmShippingRateAction(next).then((res) => {
      setRateLoading(false);
      if ('error' in res) setRateError(res.error);
      else setCharge(res.charge);
    });
  }

  function openForm() {
    setOpen(true);
    setError(null);
    if (!branches) {
      startTransition(async () => {
        const res = await getNcmBranchesAction();
        if ('error' in res) setError(res.error);
        else setBranches(res.branches);
      });
    }
  }

  function handleShip() {
    if (!toBranch) { setError('Pick a destination branch.'); return; }
    setError(null);
    startTransition(async () => {
      const res = await shipViaNcmAction(orderId, { toBranch, cod, instruction: instruction || undefined });
      if ('error' in res) setError(res.error);
      else setOpen(false);
    });
  }

  function handleSync() {
    // Deliberately its own state, not the shared `isPending` transition — that one wasn't
    // reliably flipping back to false after this action (network tab confirmed the request
    // itself completes fine), and there was no positive confirmation on success either, which
    // is why it looked stuck/like nothing was happening either way.
    setSyncing(true);
    setError(null);
    setSynced(false);
    syncNcmStatusAction(orderId)
      .then((res) => {
        if ('error' in res) setError(res.error);
        else {
          setSynced(true);
          setTimeout(() => setSynced(false), 2000);
        }
      })
      .finally(() => setSyncing(false));
  }

  if (ncmOrderId) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-3 text-sm uppercase tracking-wide">Courier — NCM</h2>
        <div className="space-y-2 text-sm">
          <p className="text-stone-500">
            NCM order{' '}
            <a
              href={`${NCM_PORTAL_BASE_URL}/accounts/vendor/order/${ncmOrderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#c96a3a] hover:underline"
            >
              #{ncmOrderId} ↗
            </a>
          </p>
          {ncmDestinationBranch && <p className="text-stone-500">To: <span className="text-stone-900">{ncmDestinationBranch}</span></p>}
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
            {ncmTrackingStatus ?? 'Pending'}
          </p>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : synced ? 'Synced ✓' : 'Sync status'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h2 className="font-semibold text-stone-900 mb-3 text-sm uppercase tracking-wide">Courier — NCM</h2>
      {!open ? (
        <button
          onClick={openForm}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-700 transition-colors"
        >
          Ship via NCM
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Destination branch</label>
            {branches === null ? (
              <p className="text-xs text-stone-400">Loading branches…</p>
            ) : (
              <select
                value={toBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
              >
                <option value="">Select a branch…</option>
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.district ? `${b.name} — ${b.district}` : b.name}</option>
                ))}
              </select>
            )}
            {toBranch && (
              <p className="text-xs mt-1.5">
                {rateLoading ? (
                  <span className="text-stone-400">Fetching delivery charge…</span>
                ) : rateError ? (
                  <span className="text-red-600">{rateError}</span>
                ) : charge !== null ? (
                  <span className="text-stone-500">Delivery fee (NCM): <span className="font-medium text-stone-800">NPR {charge.toLocaleString()}</span></span>
                ) : null}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={cod} onChange={(e) => setCod(e.target.checked)} />
            Collect on delivery (NPR {remainingNpr})
          </label>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Delivery instruction <span className="text-stone-400 font-normal">— optional</span></label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={2}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShip}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-60"
            >
              {isPending ? 'Shipping…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
