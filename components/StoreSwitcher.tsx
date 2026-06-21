'use client';

import { useTransition } from 'react';
import { setStore } from '@/app/(admin)/store-actions';
import type { StoreSummary } from '@/lib/api';

/** Lets the admin pick which store they're managing. Hidden when there's only one. */
export default function StoreSwitcher({ stores, current }: { stores: StoreSummary[]; current: string }) {
  const [pending, start] = useTransition();
  if (stores.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-xs text-stone-500">
      <span className="uppercase tracking-wide">Store</span>
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => start(() => setStore(e.target.value))}
        className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm text-stone-800 disabled:opacity-50"
      >
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </label>
  );
}
