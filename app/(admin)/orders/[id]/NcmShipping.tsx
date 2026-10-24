'use client';

import { useState } from 'react';
import { syncNcmStatusAction } from '../actions';
import NcmBookingForm from './NcmBookingForm';

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
  itemTotalNpr,
  paidNpr,
  deliveryFeeNpr,
  initialName,
  initialPhone,
  initialAddress,
  initialFromBranch,
  paymentMethod,
  deliveryFeePending = false,
  currentStatus,
}: {
  orderId: string;
  ncmOrderId?: number | null;
  ncmDestinationBranch?: string | null;
  ncmTrackingStatus?: string | null;
  remainingNpr: number;
  itemTotalNpr: number;
  paidNpr: number;
  deliveryFeeNpr: number;
  initialName: string;
  initialPhone: string;
  initialAddress: string;
  initialFromBranch: string;
  paymentMethod?: string | null;
  /** The order's delivery fee hasn't been set yet — offer NCM's quote as the fee. */
  deliveryFeePending?: boolean;
  currentStatus?: string;
}) {
  const alreadyShipped = currentStatus === 'shipped' || currentStatus === 'delivered';
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

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
      {alreadyShipped && (
        <p className="text-xs text-amber-700 mb-3">
          Marked {currentStatus}, but no NCM pickup is booked for this order.
        </p>
      )}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-700 transition-colors"
        >
          Book NCM pickup
        </button>
      ) : (
        <NcmBookingForm
          orderId={orderId}
          remainingNpr={remainingNpr}
          itemTotalNpr={itemTotalNpr}
          paidNpr={paidNpr}
          deliveryFeeNpr={deliveryFeeNpr}
          initialName={initialName}
          initialPhone={initialPhone}
          initialAddress={initialAddress}
          initialFromBranch={initialFromBranch}
          paymentMethod={paymentMethod}
          deliveryFeePending={deliveryFeePending}
          onCancel={() => setOpen(false)}
          onBooked={() => setOpen(false)}
        />
      )}
    </div>
  );
}
