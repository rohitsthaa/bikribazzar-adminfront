'use client';

import { useState, useTransition } from 'react';
import type { PlanConfigView, SubscriptionInvoiceView } from '@/lib/api';
import { requestUpgradeAction, switchToFreePlanAction } from './actions';

const STATUS_META: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:    { label: 'Active',    dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50' },
  trialing:  { label: 'Trialing',  dot: 'bg-sky-500',    text: 'text-sky-700',    bg: 'bg-sky-50' },
  past_due:  { label: 'Past due',  dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50' },
  lapsed:    { label: 'Lapsed',    dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50' },
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtNpr(n: number) {
  return n === 0 ? 'Free' : `Rs ${n.toLocaleString('en-IN')}/mo`;
}

// ── Pay-now buttons for a pending invoice ────────────────────────────────────

function PayWithEsewaButton({ invoice }: { invoice: SubscriptionInvoiceView }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const returnUrl = `${window.location.origin}/billing/return/esewa`;
      const res = await fetch('/api/billing/esewa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, amountNpr: 0, returnUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Could not start the payment.');
        setLoading(false);
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.formUrl;
      for (const [name, value] of Object.entries(data.fields as Record<string, string | number>)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-colors"
        style={{ backgroundColor: '#60BB46' }}
      >
        {loading ? 'Redirecting to eSewa…' : `Pay Rs ${invoice.amountNpr.toLocaleString()} with eSewa`}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function PayWithKhaltiButton({ invoice }: { invoice: SubscriptionInvoiceView }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const returnUrl = `${window.location.origin}/billing/return/khalti`;
      const res = await fetch('/api/billing/khalti/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, amountNpr: 0, returnUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        setError(data?.error ?? 'Could not start the payment.');
        setLoading(false);
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-colors"
        style={{ backgroundColor: '#5C2D91' }}
      >
        {loading ? 'Redirecting to Khalti…' : `Pay Rs ${invoice.amountNpr.toLocaleString()} with Khalti`}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

// ── Pending-invoice panel (shown once an upgrade has been requested) ────────

function PendingInvoicePanel({ invoice, planName }: { invoice: SubscriptionInvoiceView; planName: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-amber-900">
          Upgrade to {planName} — Rs {invoice.amountNpr.toLocaleString()} due
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Pay now to activate immediately, or pay by bank transfer / WhatsApp and we&apos;ll confirm
          it within one business day.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        <PayWithEsewaButton invoice={invoice} />
        <PayWithKhaltiButton invoice={invoice} />
      </div>
      <p className="text-[11px] text-amber-700">
        Prefer bank transfer or WhatsApp? Reach out with your store name and we&apos;ll confirm this
        invoice once payment comes through — no need to wait here.
      </p>
    </div>
  );
}

// ── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  onUpgraded,
}: {
  plan: PlanConfigView;
  isCurrent: boolean;
  onUpgraded: (invoice: SubscriptionInvoiceView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  function choose() {
    setBusy(true);
    setError('');
    startTransition(async () => {
      if (plan.priceNpr === 0) {
        const result = await switchToFreePlanAction(plan.id);
        if ('error' in result) setError(result.error);
        setBusy(false);
        return;
      }
      const result = await requestUpgradeAction(plan.id);
      if ('error' in result) {
        setError(result.error);
      } else {
        onUpgraded(result.invoice);
      }
      setBusy(false);
    });
  }

  return (
    <div className={`rounded-xl border p-5 ${isCurrent ? 'border-stone-300 bg-stone-50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">{plan.name}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {fmtNpr(plan.priceNpr)} · {plan.maxProducts === null ? 'Unlimited products' : `${plan.maxProducts} products`}
          </p>
        </div>
        {isCurrent && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 font-medium flex-shrink-0">
            Current plan
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-1 text-xs text-stone-500">
        {plan.allowPremiumTemplates && <li>Premium templates</li>}
        {plan.allowCustomDomain && <li>Custom domain</li>}
        {plan.allowOnlinePayments && <li>Online payments (eSewa/Khalti)</li>}
        {!plan.showBadge && <li>No &quot;Powered by&quot; badge</li>}
      </ul>
      {!isCurrent && (
        <button
          onClick={choose}
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-stone-900 text-white px-4 py-2 text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {busy ? 'Working…' : plan.priceNpr === 0 ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
        </button>
      )}
      {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

interface Props {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  plans: PlanConfigView[];
  invoices: SubscriptionInvoiceView[];
}

export default function BillingUpgradeClient({
  plan, subscriptionStatus, trialEndsAt, nextBillingAt, plans, invoices,
}: Props) {
  // A pending invoice from a fresh upgrade request in THIS session shows the pay panel
  // immediately, without waiting for revalidatePath's server round-trip. Falls back to any
  // pending invoice already on the server (e.g. the owner started an upgrade earlier, left,
  // and came back) so the pay-now panel survives a refresh.
  const serverPending = invoices.find((i) => i.status === 'pending' || i.status === 'overdue') ?? null;
  const [freshInvoice, setFreshInvoice] = useState<SubscriptionInvoiceView | null>(null);
  const pendingInvoice = freshInvoice ?? serverPending;

  const currentPlanMeta = plans.find((p) => p.id === plan);
  const statusMeta = STATUS_META[subscriptionStatus] ?? { label: subscriptionStatus, dot: 'bg-stone-400', text: 'text-stone-600', bg: 'bg-stone-50' };
  const trialEndsLabel = fmtDate(trialEndsAt);
  const nextBillingLabel = fmtDate(nextBillingAt);

  const pendingPlanName = pendingInvoice ? plans.find((p) => p.id === pendingInvoice.planId)?.name ?? pendingInvoice.planId : '';

  return (
    <div className="space-y-6">
      {/* Current plan summary */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-stone-900">{currentPlanMeta?.name ?? plan}</p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        </div>
        <div className="flex gap-5 mt-2 text-xs text-stone-500">
          {trialEndsLabel && <span>Trial ends {trialEndsLabel}</span>}
          {nextBillingLabel && <span>Next billing {nextBillingLabel}</span>}
        </div>
      </div>

      {pendingInvoice && <PendingInvoicePanel invoice={pendingInvoice} planName={pendingPlanName} />}

      {/* Available plans */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">Plans</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} isCurrent={p.id === plan} onUpgraded={setFreshInvoice} />
          ))}
        </div>
      </div>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Invoice history</p>
          <div className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2.5 px-4">
                <div>
                  <p className="text-sm text-stone-800">
                    {fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)}
                  </p>
                  <p className="text-[11px] text-stone-400">{inv.planId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-700">Rs {inv.amountNpr.toLocaleString()}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium capitalize">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
