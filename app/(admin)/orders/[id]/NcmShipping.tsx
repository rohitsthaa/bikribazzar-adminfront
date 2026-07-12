'use client';

import { useState, useTransition } from 'react';
import { getNcmBranchesAction, shipViaNcmAction, syncNcmStatusAction } from '../actions';
import type { NcmBranch } from '@/lib/api';

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
    startTransition(async () => {
      const res = await syncNcmStatusAction(orderId);
      if ('error' in res) setError(res.error);
    });
  }

  if (ncmOrderId) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-3 text-sm uppercase tracking-wide">Courier — NCM</h2>
        <div className="space-y-2 text-sm">
          <p className="text-stone-500">NCM order <span className="font-medium text-stone-900">#{ncmOrderId}</span></p>
          {ncmDestinationBranch && <p className="text-stone-500">To: <span className="text-stone-900">{ncmDestinationBranch}</span></p>}
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
            {ncmTrackingStatus ?? 'Pending'}
          </p>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <button
          onClick={handleSync}
          disabled={isPending}
          className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Syncing…' : 'Sync status'}
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
                onChange={(e) => setToBranch(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
              >
                <option value="">Select a branch…</option>
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name} — {b.district}</option>
                ))}
              </select>
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
