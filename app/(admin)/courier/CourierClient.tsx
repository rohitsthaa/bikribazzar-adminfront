'use client';

import { useMemo, useState } from 'react';
import type { NcmBranch, NcmPricingRate } from '@/lib/api';

const inputCls = 'w-full max-w-xs border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';
const thCls = 'text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-4 py-2.5';
const tdCls = 'px-4 py-2.5 text-sm text-stone-700';

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
      {message}
    </div>
  );
}

function BranchesTab({ branches }: { branches: NcmBranch[] | null }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!branches) return [];
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      (b.district ?? '').toLowerCase().includes(q) ||
      (b.province ?? '').toLowerCase().includes(q)
    );
  }, [branches, query]);

  if (!branches) {
    return <ErrorNote message="Could not load NCM's branch list — this is a public endpoint, so a failure here likely means NCM's server is unreachable, not a config issue." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search branches by name, district, or province…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputCls}
        />
        <p className="text-xs text-stone-400 flex-shrink-0">{filtered.length} of {branches.length} branches</p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full">
            <thead className="bg-stone-50 sticky top-0">
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>District</th>
                <th className={thCls}>Province</th>
                <th className={thCls}>Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((b) => (
                <tr key={b.pk} className="hover:bg-stone-50/70">
                  <td className={`${tdCls} font-medium text-stone-900`}>{b.name}</td>
                  <td className={tdCls}>{b.district || '—'}</td>
                  <td className={tdCls}>{b.province || '—'}</td>
                  <td className={tdCls}>{b.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PriceListTab({ pricing }: { pricing: { fromBranch: string; rates: NcmPricingRate[] } | null }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!pricing) return [];
    const q = query.trim().toLowerCase();
    if (!q) return pricing.rates;
    return pricing.rates.filter((r) => r.toBranch.toLowerCase().includes(q));
  }, [pricing, query]);

  if (!pricing) {
    return (
      <ErrorNote message='NCM is not configured for this store (or the vendor token is invalid) — set it up in Platform → Config → Courier before a price list can be fetched. Unlike the branch directory, this endpoint requires a valid vendor token.' />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search destination branch…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputCls}
        />
        <p className="text-xs text-stone-400 flex-shrink-0">
          From <span className="font-medium text-stone-600">{pricing.fromBranch}</span> · {filtered.length} of {pricing.rates.length} destinations
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full">
            <thead className="bg-stone-50 sticky top-0">
              <tr>
                <th className={thCls}>Destination</th>
                <th className={`${thCls} text-right`}>Door delivery</th>
                <th className={`${thCls} text-right`}>Branch delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((r) => (
                <tr key={r.toBranch} className="hover:bg-stone-50/70">
                  <td className={`${tdCls} font-medium text-stone-900`}>{r.toBranch}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>NPR {r.doorCharge.toLocaleString()}</td>
                  <td className={`${tdCls} text-right tabular-nums text-stone-500`}>NPR {r.branchCharge.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-stone-400">
        Door delivery = Pickup/Collect or Send (full base charge). Branch delivery = Door2Branch
        or Branch2Branch (base charge − NPR 50), per NCM&apos;s own charge table.
      </p>
    </div>
  );
}

export default function CourierClient({
  branches, pricing,
}: {
  branches: NcmBranch[] | null;
  pricing: { fromBranch: string; rates: NcmPricingRate[] } | null;
}) {
  const [tab, setTab] = useState<'branches' | 'pricing'>('branches');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {([
          { key: 'branches', label: `Branches${branches ? ` (${branches.length})` : ''}` },
          { key: 'pricing', label: 'Price list' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'branches' ? <BranchesTab branches={branches} /> : <PriceListTab pricing={pricing} />}
    </div>
  );
}
