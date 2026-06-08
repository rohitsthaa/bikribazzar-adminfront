'use client';

import { useState, useTransition } from 'react';
import { recordPaymentAction } from '../actions';

interface Props {
  orderId: string;
  totalNpr: number;
  advanceNpr: number;
  paidNpr: number;
  currency?: string;
}

export default function PaymentRecorder({ orderId, totalNpr, advanceNpr, paidNpr, currency = 'NPR' }: Props) {
  const [value, setValue] = useState(paidNpr.toString());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const chips = [
    { label: 'None', amount: 0 },
    ...(advanceNpr > 0 ? [{ label: `Advance (${currency} ${advanceNpr.toLocaleString()})`, amount: advanceNpr }] : []),
    { label: `Full (${currency} ${totalNpr.toLocaleString()})`, amount: totalNpr },
  ];

  function handleSave() {
    const amount = parseInt(value, 10);
    if (isNaN(amount) || amount < 0) { setError('Enter a valid amount'); return; }
    if (amount > totalNpr) { setError('Cannot exceed order total'); return; }
    setError('');
    setSaved(false);
    startTransition(async () => {
      const result = await recordPaymentAction(orderId, amount);
      if ('error' in result) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  const currentPaid = parseInt(value, 10) || 0;
  const remaining = Math.max(0, totalNpr - currentPaid);

  return (
    <div className="space-y-3">
      {/* Quick-select chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => { setValue(chip.amount.toString()); setError(''); setSaved(false); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              parseInt(value, 10) === chip.amount
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">{currency}</span>
          <input
            type="number"
            min={0}
            max={totalNpr}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); setSaved(false); }}
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
        >
          {isPending && (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
            </svg>
          )}
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Remaining preview */}
      {currentPaid > 0 && currentPaid < totalNpr && (
        <p className="text-xs text-stone-500">
          Remaining on delivery:{' '}
          <span className="font-semibold text-stone-700">{currency} {remaining.toLocaleString()}</span>
        </p>
      )}
      {currentPaid >= totalNpr && (
        <p className="text-xs text-green-600 font-medium">Fully paid ✓</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-600">Payment recorded ✓</p>}
    </div>
  );
}
