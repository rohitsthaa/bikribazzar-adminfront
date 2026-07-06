'use client';

import { useState, useTransition } from 'react';
import type { PlanConfigView, PlanConfigUpdateInput } from '@/lib/api';
import { updatePlanAction } from './actions';

const inputCls = 'mt-0.5 w-full text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400';
const labelCls = 'text-[11px] text-stone-500 block';

function fmtNpr(n: number) {
  return `Rs ${n.toLocaleString('en-IN')}`;
}

function PlanCard({
  plan,
  onSaved,
}: {
  plan: PlanConfigView;
  onSaved: (id: string, patch: Partial<PlanConfigView>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [priceNpr, setPriceNpr] = useState(plan.priceNpr);
  const [unlimited, setUnlimited] = useState(plan.maxProducts === null);
  const [maxProducts, setMaxProducts] = useState(plan.maxProducts ?? 50);
  const [allowPremiumTemplates, setAllowPremiumTemplates] = useState(plan.allowPremiumTemplates);
  const [allowCustomDomain, setAllowCustomDomain] = useState(plan.allowCustomDomain);
  const [allowOnlinePayments, setAllowOnlinePayments] = useState(plan.allowOnlinePayments);
  const [showBadge, setShowBadge] = useState(plan.showBadge);
  const [sortOrder, setSortOrder] = useState(plan.sortOrder);
  const [saving, setSaving] = useState(false);
  const [busyActive, setBusyActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save() {
    setSaving(true);
    setError(null);
    const wasUnlimited = plan.maxProducts === null;
    const fields: PlanConfigUpdateInput = {
      name,
      priceNpr,
      allowPremiumTemplates,
      allowCustomDomain,
      allowOnlinePayments,
      showBadge,
      sortOrder,
    };
    if (unlimited) {
      // Only send the clear sentinel if it wasn't already unlimited — avoids a no-op PATCH
      // being rejected (the API 400s if every field in the request is null/false).
      if (!wasUnlimited) fields.clearMaxProducts = true;
    } else {
      fields.maxProducts = maxProducts;
    }
    startTransition(async () => {
      const result = await updatePlanAction(plan.id, fields);
      if ('error' in result) {
        setError(result.error);
      } else {
        onSaved(plan.id, {
          name, priceNpr, maxProducts: unlimited ? null : maxProducts,
          allowPremiumTemplates, allowCustomDomain, allowOnlinePayments, showBadge, sortOrder,
        });
        setEditing(false);
      }
      setSaving(false);
    });
  }

  function toggleActive() {
    setBusyActive(true);
    startTransition(async () => {
      const result = await updatePlanAction(plan.id, { isActive: !plan.isActive });
      if (!('error' in result)) onSaved(plan.id, { isActive: !plan.isActive });
      setBusyActive(false);
    });
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${plan.isActive ? 'border-stone-200' : 'border-stone-200 opacity-60'}`}>
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-stone-900">{plan.name}</h3>
            <span className="text-[10px] text-stone-400 font-mono">{plan.id}</span>
            {!plan.isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">Retired</span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {fmtNpr(plan.priceNpr)}/mo · {plan.maxProducts === null ? 'Unlimited products' : `${plan.maxProducts} products`}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {plan.allowPremiumTemplates && <Badge>Premium templates</Badge>}
            {plan.allowCustomDomain && <Badge>Custom domain</Badge>}
            {plan.allowOnlinePayments && <Badge>Online payments</Badge>}
            {plan.showBadge && <Badge>Shows "Powered by" badge</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            {editing ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={toggleActive}
            disabled={busyActive}
            title={plan.isActive ? 'Retire this plan (hidden from new signups)' : 'Reactivate this plan'}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {busyActive ? '…' : plan.isActive ? 'Retire' : 'Reactivate'}
          </button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-stone-100 px-4 py-3.5 space-y-3 bg-stone-50">
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Name
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={labelCls}>
              Price (NPR/mo)
              <input
                type="number"
                className={inputCls}
                value={priceNpr}
                onChange={(e) => setPriceNpr(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="flex items-end gap-3">
            <label className={`${labelCls} flex-1`}>
              Max products
              <input
                type="number"
                className={inputCls}
                value={maxProducts}
                disabled={unlimited}
                onChange={(e) => setMaxProducts(Number(e.target.value))}
              />
            </label>
            <label className="text-[11px] text-stone-500 flex items-center gap-1.5 pb-1.5">
              <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
              Unlimited
            </label>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <input type="checkbox" checked={allowPremiumTemplates} onChange={(e) => setAllowPremiumTemplates(e.target.checked)} />
              Premium templates
            </label>
            <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <input type="checkbox" checked={allowCustomDomain} onChange={(e) => setAllowCustomDomain(e.target.checked)} />
              Custom domain
            </label>
            <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <input type="checkbox" checked={allowOnlinePayments} onChange={(e) => setAllowOnlinePayments(e.target.checked)} />
              Online payments
            </label>
            <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <input type="checkbox" checked={showBadge} onChange={(e) => setShowBadge(e.target.checked)} />
              Show "Powered by" badge
            </label>
          </div>

          <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
            Sort order
            <input
              type="number"
              className="w-16 text-sm border border-stone-200 rounded-lg px-2 py-1"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </label>

          {error && <p className="text-[11px] text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
      {children}
    </span>
  );
}

export default function PlansClient({ plans }: { plans: PlanConfigView[] }) {
  const [overrides, setOverrides] = useState<Record<string, Partial<PlanConfigView>>>({});

  function applyOverride(id: string, patch: Partial<PlanConfigView>) {
    setOverrides((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  }

  const merged = plans
    .map((p) => ({ ...p, ...overrides[p.id] }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (merged.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 px-6 py-10 text-center">
        <p className="text-sm text-stone-400">No plans found.</p>
        <p className="text-xs text-stone-400 mt-1">
          Plans are seeded via migration — check that the catalog migration has run.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {merged.map((p) => (
        <PlanCard key={p.id} plan={p} onSaved={applyOverride} />
      ))}
    </div>
  );
}
