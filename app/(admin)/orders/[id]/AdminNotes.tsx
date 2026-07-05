'use client';

import { useState, useTransition } from 'react';
import { saveAdminNotesAction } from '../actions';

export default function AdminNotes({ orderId, initialNotes }: { orderId: string; initialNotes?: string }) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError('');
    startTransition(async () => {
      const result = await saveAdminNotesAction(orderId, notes);
      if (result && 'error' in result) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-stone-900 text-sm uppercase tracking-wide">Internal Notes</h2>
        <span className="text-xs text-stone-400">Not visible to customer</span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        placeholder="e.g. Called customer — confirmed delivery Saturday morning..."
        rows={4}
        className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 text-stone-700 placeholder:text-stone-300"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
          ✓ Saved
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors font-medium"
        >
          {isPending ? 'Saving…' : 'Save notes'}
        </button>
      </div>
    </div>
  );
}
