'use client';

import { useState, useTransition } from 'react';
import { getNcmBranchesAction, getNcmShippingRateAction, saveDeliveryAction } from '../actions';
import type { NcmBranch } from '@/lib/api';

/**
 * Lets staff resolve a pending (or already-set) delivery fee right from the Payment
 * card, two ways: look up NCM's real quoted charge for a destination branch (same
 * lookup NcmShipping.tsx uses for the actual shipment), or just type a number. Both
 * paths save through the same `saveDeliveryAction({ deliveryFee })` call, which also
 * clears `DeliveryFeePending` server-side (see OrderEndpoints.cs) — deliberately sends
 * only `deliveryFee`, no address fields, so it never touches the address saved via
 * DeliveryEditor.tsx elsewhere on this page.
 */
export default function DeliveryFeeResolver({
  orderId,
  currentDeliveryFee,
  deliveryFeePending,
  currency,
}: {
  orderId: string;
  currentDeliveryFee?: number;
  deliveryFeePending?: boolean;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NCM branch lookup
  const [branches, setBranches] = useState<NcmBranch[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [toBranch, setToBranch] = useState('');
  const [charge, setCharge] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Manual entry
  const [manualFee, setManualFee] = useState(
    currentDeliveryFee && currentDeliveryFee > 0 ? String(currentDeliveryFee) : ''
  );

  function openEditor() {
    setOpen(true);
    setError(null);
    if (!branches && !branchesError) {
      setBranchesLoading(true);
      getNcmBranchesAction().then((res) => {
        setBranchesLoading(false);
        if ('error' in res) setBranchesError(res.error);
        else setBranches(res.branches);
      });
    }
  }

  function handleBranchChange(next: string) {
    setToBranch(next);
    setCharge(null);
    setRateError(null);
    if (!next) return;
    setRateLoading(true);
    getNcmShippingRateAction(next).then((res) => {
      setRateLoading(false);
      if ('error' in res) setRateError(res.error);
      else setCharge(res.charge);
    });
  }

  function save(fee: number) {
    setError(null);
    startTransition(async () => {
      const result = await saveDeliveryAction(orderId, { deliveryFee: fee });
      if (result && 'error' in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function handleManualSave() {
    const trimmed = manualFee.trim();
    const n = Number(trimmed);
    if (!trimmed || Number.isNaN(n) || n < 0) {
      setError('Enter a valid delivery fee.');
      return;
    }
    save(n);
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={openEditor}
          className={`text-xs font-medium underline underline-offset-2 ${
            deliveryFeePending ? 'text-amber-700 hover:text-amber-900' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {currentDeliveryFee ? 'Change delivery fee' : 'Set delivery fee'}
        </button>
        {saved && <span className="text-xs text-green-600">✓ Saved</span>}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-3">
      {/* NCM branch lookup */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Look up via NCM</label>
        {branchesLoading ? (
          <p className="text-xs text-stone-400">Loading branches…</p>
        ) : branchesError ? (
          <p className="text-xs text-stone-400">{branchesError}</p>
        ) : (
          <select
            value={toBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
          >
            <option value="">Select a destination branch…</option>
            {branches?.map((b) => (
              <option key={b.pk} value={b.name}>
                {[b.name, [b.district, b.province].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
              </option>
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
              <span className="text-stone-500">
                NCM quote: <span className="font-medium text-stone-800">{currency} {charge.toLocaleString()}</span>
              </span>
            ) : null}
          </p>
        )}
        {charge !== null && (
          <button
            type="button"
            onClick={() => save(charge)}
            disabled={isPending}
            className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-stone-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Saving…' : `Use ${currency} ${charge.toLocaleString()} as delivery fee`}
          </button>
        )}
      </div>

      {/* Manual entry */}
      <div className="pt-2 border-t border-stone-200">
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Or set manually ({currency})</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={manualFee}
            onChange={(e) => setManualFee(e.target.value)}
            placeholder="e.g. 150"
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
          />
          <button
            type="button"
            onClick={handleManualSave}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={isPending}
        className="text-xs text-stone-500 hover:text-stone-800"
      >
        Cancel
      </button>
    </div>
  );
}
