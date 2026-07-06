'use client';

import { useState, useTransition } from 'react';
import type { PlanConfigView, SubscriptionInvoiceView } from '@/lib/api';
import { overrideStorePlanAction, createInvoiceAction, patchInvoiceAction, startTrialAction } from '../actions';

const inputCls = 'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60';
const labelCls = 'text-xs font-medium text-stone-600 mb-1 block';

const STATUS_META: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:    { label: 'Active',    dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50' },
  trialing:  { label: 'Trialing',  dot: 'bg-sky-500',    text: 'text-sky-700',    bg: 'bg-sky-50' },
  past_due:  { label: 'Past due',  dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50' },
  lapsed:    { label: 'Lapsed',    dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50' },
};

const INVOICE_STATUS_META: Record<string, { label: string; text: string; bg: string }> = {
  pending:  { label: 'Pending',  text: 'text-stone-600',  bg: 'bg-stone-100' },
  paid:     { label: 'Paid',     text: 'text-green-700',  bg: 'bg-green-50' },
  void:     { label: 'Void',     text: 'text-stone-400',  bg: 'bg-stone-50' },
  overdue:  { label: 'Overdue',  text: 'text-amber-700',  bg: 'bg-amber-50' },
  lapsed:   { label: 'Lapsed',   text: 'text-red-700',    bg: 'bg-red-50' },
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtNpr(n: number) {
  return `Rs ${n.toLocaleString('en-IN')}`;
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, dot: 'bg-stone-400', text: 'text-stone-600', bg: 'bg-stone-50' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// ── Current plan summary + override ─────────────────────────────────────────

function PlanOverview({
  storeId,
  plan,
  subscriptionStatus,
  trialEndsAt,
  nextBillingAt,
  plans,
}: {
  storeId: string;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  plans: PlanConfigView[];
}) {
  const [editing, setEditing] = useState(false);
  const [planId, setPlanId] = useState(plan);
  const [status, setStatus] = useState(subscriptionStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState({ plan, subscriptionStatus });
  const [trialEnd, setTrialEnd] = useState(trialEndsAt);
  const [, startTransition] = useTransition();

  // ── Start/extend trial (separate from the generic override below — this is the
  // common "let this customer try Growth free" action, not a stuck-status fix) ──
  const [trialPanelOpen, setTrialPanelOpen] = useState(false);
  const [trialDate, setTrialDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [trialSaving, setTrialSaving] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  const planMeta = plans.find((p) => p.id === current.plan);

  function save() {
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const result = await overrideStorePlanAction(storeId, planId, status);
      if ('error' in result) {
        setError(result.error);
      } else {
        setCurrent({ plan: planId, subscriptionStatus: status });
        setEditing(false);
      }
      setSaving(false);
    });
  }

  function saveTrial() {
    setTrialSaving(true);
    setTrialError(null);
    const iso = new Date(trialDate).toISOString();
    startTransition(async () => {
      const result = await startTrialAction(storeId, iso);
      if ('error' in result) {
        setTrialError(result.error);
      } else {
        setCurrent((c) => ({ ...c, subscriptionStatus: 'trialing' }));
        setStatus('trialing');
        setTrialEnd(iso);
        setTrialPanelOpen(false);
      }
      setTrialSaving(false);
    });
  }

  return (
    <div className="rounded-xl border border-stone-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-stone-900">{planMeta?.name ?? current.plan}</p>
            <StatusBadge status={current.subscriptionStatus} />
          </div>
          {planMeta && (
            <p className="text-xs text-stone-400 mt-1">
              {fmtNpr(planMeta.priceNpr)}/mo · {planMeta.maxProducts === null ? 'Unlimited products' : `${planMeta.maxProducts} products`}
            </p>
          )}
          <div className="flex gap-5 mt-2.5 text-xs text-stone-500">
            {trialEnd && <span>Trial ends {fmtDate(trialEnd)}</span>}
            <span>Next billing {fmtDate(nextBillingAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setTrialPanelOpen((e) => !e)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
          >
            {trialPanelOpen ? 'Close' : 'Start/extend trial'}
          </button>
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            {editing ? 'Close' : 'Override'}
          </button>
        </div>
      </div>

      {trialPanelOpen && (
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
          <p className="text-[11px] text-stone-400">
            Lets this store try any plan's features free until the date below — a trialing
            store bypasses premium-template/product-cap/online-payment gates regardless of its
            actual Plan, same as a brand-new signup's 14-day trial. Existing plan/status aren't
            otherwise touched.
          </p>
          <div className="max-w-[200px]">
            <label className={labelCls}>Trial ends</label>
            <input
              type="date"
              className={inputCls}
              value={trialDate}
              onChange={(e) => setTrialDate(e.target.value)}
            />
          </div>
          {trialError && <p className="text-[11px] text-red-600">{trialError}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={saveTrial}
              disabled={trialSaving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-sky-600 text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {trialSaving ? 'Saving…' : 'Start/extend trial'}
            </button>
            <button
              onClick={() => setTrialPanelOpen(false)}
              disabled={trialSaving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
          <p className="text-[11px] text-stone-400">
            Direct override — bypasses the invoice flow. Prefer generating + marking an invoice
            paid below for a normal upgrade/renewal; use this for comps or fixing a stuck status.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Plan</label>
              <select className={inputCls} value={planId} onChange={(e) => setPlanId(e.target.value)}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past due</option>
                <option value="lapsed">Lapsed</option>
              </select>
            </div>
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save override'}
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

// ── Generate next invoice ────────────────────────────────────────────────────

function GenerateInvoiceForm({
  storeId,
  plans,
  defaultPlanId,
  pendingInvoice,
}: {
  storeId: string;
  plans: PlanConfigView[];
  defaultPlanId: string;
  /** An already-pending/overdue invoice, if one exists — shown as a heads-up so an admin
   *  doesn't accidentally leave two pending invoices for the same store. This form doesn't
   *  block generating a second one (e.g. deliberately replacing a wrong one) — void the old
   *  one from the history list below first if that's the intent. */
  pendingInvoice: SubscriptionInvoiceView | null;
}) {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [planId, setPlanId] = useState(defaultPlanId);
  const [periodStart, setPeriodStart] = useState(today.toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(nextMonth.toISOString().slice(0, 10));
  const [amountNpr, setAmountNpr] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function submit() {
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceAction(storeId, {
        planId,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        amountNpr: amountNpr ? Number(amountNpr) : undefined,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        // Server action's revalidatePath refreshes this route's Server Component data
        // (the invoices list on the page) automatically — no manual refetch needed here.
        setAmountNpr('');
      }
      setSaving(false);
    });
  }

  return (
    <div className="rounded-xl border border-stone-100 p-5 space-y-3">
      <p className="text-xs font-medium text-stone-600">Generate next invoice</p>
      {pendingInvoice && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          This store already has a {pendingInvoice.status} invoice for <strong>{pendingInvoice.planId}</strong> ·
          {' '}Rs {pendingInvoice.amountNpr.toLocaleString()}. Generating another leaves both outstanding —
          void the old one below first if this is meant to replace it (e.g. applying a discount).
        </p>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Plan</label>
          <select className={inputCls} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Period start</label>
          <input type="date" className={inputCls} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Period end</label>
          <input type="date" className={inputCls} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
      </div>
      <div className="sm:w-1/3">
        <label className={labelCls}>Amount override <span className="text-stone-400 font-normal">(optional — use for a discount)</span></label>
        <input
          type="number"
          className={inputCls}
          value={amountNpr}
          onChange={(e) => setAmountNpr(e.target.value)}
          placeholder="Defaults to plan price"
        />
        <p className="text-[10px] text-stone-400 mt-1">
          E.g. enter a lower amount to give this specific invoice a one-off discount. If the
          store owner later requests this same upgrade themselves from their own Billing page,
          they&apos;ll be shown and can pay THIS discounted invoice rather than a new full-price one.
        </p>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={saving}
        className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#c96a3a] text-white hover:bg-[#b85f33] transition-colors disabled:opacity-50"
      >
        {saving ? 'Generating…' : 'Generate invoice'}
      </button>
    </div>
  );
}

// ── Invoice history ──────────────────────────────────────────────────────────

function InvoiceRow({ storeId, invoice }: { storeId: string; invoice: SubscriptionInvoiceView }) {
  const [busy, setBusy] = useState<'paid' | 'void' | null>(null);
  const [status, setLocalStatus] = useState(invoice.status);
  const [, startTransition] = useTransition();
  const meta = INVOICE_STATUS_META[status] ?? { label: status, text: 'text-stone-500', bg: 'bg-stone-50' };
  const canAct = status === 'pending' || status === 'overdue';

  function act(next: 'paid' | 'void') {
    setBusy(next);
    startTransition(async () => {
      const result = await patchInvoiceAction(storeId, invoice.id, { status: next });
      if (!('error' in result)) setLocalStatus(next);
      setBusy(null);
    });
  }

  return (
    <div className="flex items-center justify-between py-2.5 px-4 hover:bg-stone-50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm text-stone-800">
          {fmtDate(invoice.periodStart)} – {fmtDate(invoice.periodEnd)}
        </p>
        <p className="text-[11px] text-stone-400">{invoice.planId} · Due {fmtDate(invoice.dueAt)}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-medium text-stone-700">{fmtNpr(invoice.amountNpr)}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.text}`}>{meta.label}</span>
        {canAct && (
          <>
            <button
              onClick={() => act('paid')}
              disabled={busy !== null}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {busy === 'paid' ? '…' : 'Mark paid'}
            </button>
            <button
              onClick={() => act('void')}
              disabled={busy !== null}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              {busy === 'void' ? '…' : 'Void'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

interface Props {
  storeId: string;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  plans: PlanConfigView[];
  invoices: SubscriptionInvoiceView[];
}

export default function BillingClient({
  storeId, plan, subscriptionStatus, trialEndsAt, nextBillingAt, plans, invoices,
}: Props) {
  return (
    <div className="space-y-5">
      <PlanOverview
        storeId={storeId}
        plan={plan}
        subscriptionStatus={subscriptionStatus}
        trialEndsAt={trialEndsAt}
        nextBillingAt={nextBillingAt}
        plans={plans}
      />

      <GenerateInvoiceForm
        storeId={storeId}
        plans={plans}
        defaultPlanId={plan}
        pendingInvoice={invoices.find((i) => i.status === 'pending' || i.status === 'overdue') ?? null}
      />

      <div>
        <p className="text-xs font-medium text-stone-600 mb-2">Billing history</p>
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center">
            <p className="text-xs text-stone-400">No invoices yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {invoices.map((inv) => (
              <InvoiceRow key={inv.id} storeId={storeId} invoice={inv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
