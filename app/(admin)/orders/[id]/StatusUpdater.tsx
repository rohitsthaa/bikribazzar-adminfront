'use client';

import { useTransition, useState } from 'react';
import { updateStatusAction } from '../actions';
import type { Order } from '@/lib/api';

const PIPELINE: Array<{
  value: Order['status'];
  label: string;
  dot: string;
  activeClass: string;
}> = [
  { value: 'new',       label: 'Received',  dot: 'bg-blue-400',   activeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'     },
  { value: 'confirmed', label: 'Confirmed', dot: 'bg-amber-400',  activeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'  },
  { value: 'shipped',   label: 'Shipped',   dot: 'bg-purple-400', activeClass: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'},
  { value: 'delivered', label: 'Delivered', dot: 'bg-green-400',  activeClass: 'bg-green-50 text-green-700 ring-1 ring-green-200'  },
  { value: 'cancelled', label: 'Cancelled', dot: 'bg-red-400',    activeClass: 'bg-red-50 text-red-600 ring-1 ring-red-200'        },
];

const STATUS_META: Partial<Record<Order['status'], { icon: string; description: string; confirmLabel: string; danger?: boolean }>> = {
  confirmed: {
    icon: '✓',
    description: 'Customer will be notified that their order is confirmed and being prepared.',
    confirmLabel: 'Yes, confirm order',
  },
  shipped: {
    icon: '→',
    description: 'Customer will be notified that their order is on its way.',
    confirmLabel: 'Yes, mark as shipped',
  },
  delivered: {
    icon: '✓',
    description: 'Customer will be notified that their order has been delivered.',
    confirmLabel: 'Yes, mark as delivered',
  },
  cancelled: {
    icon: '✕',
    description: 'Customer will be notified that their order has been cancelled. This cannot be undone easily.',
    confirmLabel: 'Yes, cancel order',
    danger: true,
  },
};

function ConfirmDialog({
  status,
  onConfirm,
  onCancel,
  isPending,
}: {
  status: Order['status'];
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const pipeline = PIPELINE.find((p) => p.value === status)!;
  const meta = STATUS_META[status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-150"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-100 animate-in zoom-in-95 fade-in duration-150">
          {/* Top bar */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                meta?.danger
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                  : 'bg-stone-100 text-stone-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pipeline.dot}`} />
                {pipeline.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-stone-800 leading-snug mb-1">
              Change order status?
            </p>
            <p className="text-sm text-stone-500 leading-relaxed">
              {meta?.description ?? `Status will be updated to "${pipeline.label}".`}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-2">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              Keep current
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
                meta?.danger
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-stone-900 text-white hover:bg-stone-700'
              }`}
            >
              {isPending ? 'Updating…' : (meta?.confirmLabel ?? 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: Order['status'];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<Order['status'] | null>(null);

  function handleClick(newStatus: Order['status']) {
    if (newStatus === currentStatus || isPending) return;
    setPendingStatus(newStatus);
  }

  function handleConfirm() {
    if (!pendingStatus) return;
    const toSet = pendingStatus;
    setPendingStatus(null);
    startTransition(() => updateStatusAction(orderId, toSet));
  }

  return (
    <>
      <div className={`space-y-2 transition-opacity ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
        {PIPELINE.map(({ value, label, dot, activeClass }) => {
          const isActive = value === currentStatus;
          return (
            <button
              key={value}
              onClick={() => handleClick(value)}
              disabled={isActive || isPending}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-3 ${
                isActive
                  ? `${activeClass} cursor-default`
                  : value === 'cancelled'
                  ? 'bg-stone-50 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40'
                  : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40'
              }`}
            >
              {isPending && isActive ? (
                <svg className="w-2 h-2 flex-shrink-0 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                </svg>
              ) : (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              )}
              {isPending && isActive ? 'Updating…' : label}
            </button>
          );
        })}
      </div>

      {pendingStatus && (
        <ConfirmDialog
          status={pendingStatus}
          onConfirm={handleConfirm}
          onCancel={() => setPendingStatus(null)}
          isPending={isPending}
        />
      )}
    </>
  );
}
