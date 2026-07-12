import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getStore, getStorePaymentConfig, getStoreCourierConfig, getStoreAdmins, getAllTemplates, getAllPlans, getStoreInvoices } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import { updateStoreAction, updatePaymentConfigAction, updateCourierConfigAction } from '../actions';
import { enterStore } from '../../store-actions';
import StoreAdmins from './StoreAdmins';
import TemplateThemeClient from './TemplateThemeClient';
import TemplateAccessClient from './TemplateAccessClient';
import BillingClient from './BillingClient';
import DeleteStoreSection from './DeleteStoreSection';
import SubmitButton from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string; saved?: string }> }
type ThemeShape = { colors?: { primary?: string; accent?: string; bg?: string }; fonts?: { display?: string; body?: string } };

// ── Small shared primitives ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-stone-600 mb-1.5">{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60 ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
    >
      {children}
    </select>
  );
}

function SaveBtn({ label = 'Save changes' }: { label?: string }) {
  return <SubmitButton label={label} />;
}

// ── Custom domain verification (see docs/CUSTOM_DOMAINS_PLAN.md) ────────────

const DOMAIN_STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  unverified: { label: 'Awaiting DNS', dot: 'bg-stone-400', text: 'text-stone-500' },
  verifying: { label: 'Checking DNS…', dot: 'bg-amber-500', text: 'text-amber-600' },
  verified: { label: 'Verified — provisioning', dot: 'bg-amber-500', text: 'text-amber-600' },
  active: { label: 'Live', dot: 'bg-green-500', text: 'text-green-600' },
  failed: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-500' },
};

function DomainStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const meta = DOMAIN_STATUS_META[status] ?? { label: status, dot: 'bg-stone-400', text: 'text-stone-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-50 ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// Shown until the domain is live. Two DNS records are needed and merchants
// can add both at once rather than round-tripping: a TXT record that proves
// ownership, and a CNAME/ALIAS that actually routes traffic here — the TXT
// record alone does NOT point the domain anywhere. Content changes by status
// so it doesn't keep repeating "add this record" after that step is already
// done. See docs/CUSTOM_DOMAINS_PLAN.md.
function DomainVerificationInstructions({ domain, token, storeId, platformDomain, status }: {
  domain: string; token: string; storeId: string; platformDomain: string; status: string;
}) {
  const routingTarget = `${storeId}.${platformDomain}`;

  const RoutingRecord = ({ heading }: { heading: string }) => (
    <div>
      <p className="font-medium text-stone-600">{heading} (both {domain} and www):</p>
      <p className="font-mono text-stone-700 break-all">
        CNAME (or ALIAS/ANAME)&nbsp;&nbsp;{domain}&nbsp;&nbsp;→&nbsp;&nbsp;{routingTarget}
      </p>
      <p className="font-mono text-stone-700 break-all">
        CNAME&nbsp;&nbsp;www.{domain}&nbsp;&nbsp;→&nbsp;&nbsp;{routingTarget}
      </p>
      <p className="mt-1">
        Set both to <strong>DNS-only</strong> (not proxied) if your DNS provider offers that — we need to
        reach your domain directly to issue a certificate for it.
      </p>
    </div>
  );

  if (status === 'failed') {
    return (
      <div className="mt-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 text-[11px] text-stone-500 space-y-3">
        <p className="font-medium text-red-500">
          We couldn&apos;t find the ownership record after 24 hours — double-check it below, then re-save the
          domain to retry.
        </p>
        <div>
          <p className="font-medium text-stone-600">Ownership record:</p>
          <p className="font-mono text-stone-700 break-all">
            TXT&nbsp;&nbsp;_bikribazaar-verify.{domain}&nbsp;&nbsp;{token}
          </p>
        </div>
        <RoutingRecord heading="Routing record" />
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="mt-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 text-[11px] text-stone-500 space-y-3">
        <p className="font-medium text-amber-600">
          Ownership confirmed — now provisioning a certificate. This usually takes a few minutes, but only
          works once the domain is actually pointed at your store:
        </p>
        <RoutingRecord heading="Routing record" />
        <p>No action needed if that&apos;s already in place — this will flip to &quot;Live&quot; automatically.</p>
      </div>
    );
  }

  // unverified / verifying — both records can be added together up front.
  return (
    <div className="mt-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 text-[11px] text-stone-500 space-y-3">
      <div>
        <p className="font-medium text-stone-600">1. Prove you own {domain}:</p>
        <p className="font-mono text-stone-700 break-all">
          TXT&nbsp;&nbsp;_bikribazaar-verify.{domain}&nbsp;&nbsp;{token}
        </p>
      </div>
      <RoutingRecord heading="2. Point the domain at your store" />
      <p>Checked automatically every few minutes — no need to save again once these are added.</p>
    </div>
  );
}

function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {description && <p className="text-xs text-stone-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Toggle switch (purely presentational — wraps a hidden checkbox) ───────────

function ToggleField({ name, label, description, defaultChecked }: {
  name: string; label: string; description?: string; defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative flex-shrink-0 mt-0.5">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="block w-9 h-5 rounded-full border-2 border-transparent bg-stone-200 peer-checked:bg-[#c96a3a] transition-colors" />
        <span className="absolute left-0.5 top-0.5 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {description && <p className="text-xs text-stone-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}


// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StoreManagePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await getAdmin();
  if (me?.role !== 'super') redirect('/dashboard');

  let store;
  try { store = await getStore(id); } catch { notFound(); }
  if (!store) notFound();

  const [pay, courier, admins, allTemplates, allPlans, invoices] = await Promise.all([
    getStorePaymentConfig(id).catch(() => null),
    getStoreCourierConfig(id).catch(() => null),
    getStoreAdmins(id).catch(() => []),
    getAllTemplates().catch(() => []),
    getAllPlans().catch(() => []),
    getStoreInvoices(id).catch(() => []),
  ]);

  const theme = (store.theme ?? {}) as ThemeShape;
  const saveError = sp?.error ? decodeURIComponent(sp.error) : null;
  const saveOk = sp?.saved === '1';
  const platformDomain =
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ||
    process.env.PLATFORM_DOMAIN ||
    'bikribazaar.com';

  return (
    <main className="p-6 md:p-8 max-w-3xl space-y-8">

      {/* ── Save feedback banner ── */}
      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Save failed:</strong> {saveError}
        </div>
      )}
      {saveOk && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Changes saved.
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <Link
          href="/platform"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors mb-4"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All stores
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">{store.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-stone-400">{store.id}</p>
              {store.siteType && store.siteType !== 'store' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 capitalize">{store.siteType}</span>
              )}
            </div>
          </div>
          <form action={enterStore.bind(null, store.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96a3a] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#b85f33] transition-colors shadow-sm"
            >
              Enter store
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── Section 1: General ── */}
      <SectionCard title="General" description="Core store identity and availability.">
        {store.status === 'deleted' && (
          <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 mb-4">
            This store is deleted — restore it below before editing its settings.
          </p>
        )}
        <form action={updateStoreAction} className="space-y-5">
          <input type="hidden" name="id" value={store.id} />

          <fieldset disabled={store.status === 'deleted'} className="space-y-5 disabled:opacity-50">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Store name</Label>
                <Input name="name" defaultValue={store.name} />
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={store.status === 'deleted' ? 'active' : store.status}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Label>Custom domain <span className="text-stone-400 font-normal">(optional)</span></Label>
                  <DomainStatusBadge status={store.customDomainStatus} />
                </div>
                <Input name="customDomain" defaultValue={store.customDomain ?? ''} placeholder="shop.example.com" />
                <p className="text-[11px] text-stone-400 mt-1.5">Leave blank to use the default platform subdomain.</p>
                {store.customDomain && store.customDomainStatus === 'active' && (
                  <p className="mt-2 text-[11px] text-green-600">
                    ✓ Live at{' '}
                    <a href={`https://${store.customDomain}`} target="_blank" rel="noreferrer" className="underline">
                      https://{store.customDomain}
                    </a>
                  </p>
                )}
                {store.customDomain && store.customDomainToken && store.customDomainStatus && store.customDomainStatus !== 'active' && (
                  <DomainVerificationInstructions
                    domain={store.customDomain}
                    token={store.customDomainToken}
                    storeId={store.id}
                    platformDomain={platformDomain}
                    status={store.customDomainStatus}
                  />
                )}
              </div>
              <div className="sm:col-span-2">
                <ToggleField
                  name="isDemo"
                  label="Demo store"
                  description="Excludes this store's orders/revenue from platform-wide analytics totals. Its own dashboard still works normally."
                  defaultChecked={store.isDemo}
                />
              </div>
              <div className="sm:col-span-2">
                <ToggleField
                  name="customerAuthEnabled"
                  label="Customer accounts"
                  description="Lets shoppers create an account and sign in on the storefront. Turning this off hides sign-in/register and blocks it at the API — checkout stays guest-only either way. Doesn't log out anyone already signed in."
                  defaultChecked={store.customerAuthEnabled}
                />
              </div>
            </div>

            {/* Theme/templateId are intentionally NOT part of this form — see
                the comment in updateStoreAction. They're owned exclusively by
                the Template & Theme section below. */}

            <SaveBtn />
          </fieldset>
        </form>
      </SectionCard>

      {/* ── Section 2: Template & Theme ── */}
      <SectionCard title="Template & Theme" description="Visual design applied to this store's storefront.">
        <TemplateThemeClient
          storeId={store.id}
          storeName={store.name}
          storeStatus={store.status}
          customDomain={store.customDomain ?? null}
          initialTemplateId={store.templateId}
          initialTheme={theme}
          allTemplates={allTemplates}
          allowedTemplates={store.allowedTemplates ?? null}
        />
      </SectionCard>

      {/* ── Section 3: Payment credentials ── */}
      <SectionCard title="Payment credentials" description="Secrets are encrypted at rest and never shown once saved.">
        <form action={updatePaymentConfigAction} className="space-y-6">
          <input type="hidden" name="id" value={store.id} />

          {pay?.usingDefaults && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-amber-800">
                No payment config saved — inheriting platform defaults (eSewa test mode). Saving this form creates a per-store override.
              </p>
            </div>
          )}

          {/* eSewa */}
          <div className="rounded-xl border border-stone-100 p-5 space-y-4">
            <ToggleField
              name="esewaEnabled"
              label="eSewa"
              description="Accept payments via eSewa ePay v2."
              defaultChecked={pay?.esewaEnabled}
            />
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label>Mode</Label>
                <Select name="esewaMode" defaultValue={pay?.esewaMode ?? 'test'}>
                  <option value="test">Test</option>
                  <option value="production">Production</option>
                </Select>
              </div>
              <div>
                <Label>Merchant / product code</Label>
                <Input name="esewaProductCode" defaultValue={pay?.esewaProductCode ?? ''} placeholder="EPAYTEST" />
              </div>
              <div className="sm:col-span-2">
                <Label>
                  Secret key
                  {pay?.hasEsewaSecret && (
                    <span className="ml-1.5 text-emerald-600 font-normal">· set</span>
                  )}
                </Label>
                <Input
                  name="esewaSecret"
                  type="password"
                  placeholder={pay?.hasEsewaSecret ? '•••••• (leave blank to keep current)' : 'Paste secret key'}
                />
              </div>
            </div>
          </div>

          {/* Khalti */}
          <div className="rounded-xl border border-stone-100 p-5 space-y-4">
            <ToggleField
              name="khaltiEnabled"
              label="Khalti"
              description="Accept payments via Khalti."
              defaultChecked={pay?.khaltiEnabled}
            />
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label>Mode</Label>
                <Select name="khaltiMode" defaultValue={pay?.khaltiMode ?? 'test'}>
                  <option value="test">Test</option>
                  <option value="production">Production</option>
                </Select>
              </div>
              <div>
                <Label>
                  Secret key
                  {pay?.hasKhaltiSecret && (
                    <span className="ml-1.5 text-emerald-600 font-normal">· set</span>
                  )}
                </Label>
                <Input
                  name="khaltiSecret"
                  type="password"
                  placeholder={pay?.hasKhaltiSecret ? '•••••• (leave blank to keep current)' : 'Paste live_secret_key'}
                />
              </div>
            </div>
          </div>

          <SaveBtn label="Save payment config" />
        </form>
      </SectionCard>

      {/* ── Section 3b: Courier (NCM) ── */}
      <SectionCard title="Courier — NCM (Nepal Can Move)" description="Vendor token is encrypted at rest and never shown once saved.">
        <form action={updateCourierConfigAction} className="space-y-4">
          <input type="hidden" name="id" value={store.id} />
          <div className="rounded-xl border border-stone-100 p-5 space-y-4">
            <ToggleField
              name="ncmEnabled"
              label="NCM"
              description="Ship orders via NCM directly from the order detail page."
              defaultChecked={courier?.ncm.enabled}
            />
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label>Pickup branch</Label>
                <Input name="ncmFromBranch" defaultValue={courier?.ncm.fromBranch ?? ''} placeholder="e.g. TINKUNE" />
              </div>
              <div>
                <Label>
                  Vendor token
                  {courier?.ncm.hasToken && (
                    <span className="ml-1.5 text-emerald-600 font-normal">· set</span>
                  )}
                </Label>
                <Input
                  name="ncmToken"
                  type="password"
                  placeholder={courier?.ncm.hasToken ? '•••••• (leave blank to keep current)' : 'Paste NCM API token'}
                />
              </div>
            </div>
          </div>
          <SaveBtn label="Save courier config" />
        </form>
      </SectionCard>

      {/* ── Section 4: Template Access ── */}
      <SectionCard
        title="Template access"
        description="Control which storefront themes this store can use. Grant exclusive/private templates here."
      >
        <TemplateAccessClient
          storeId={store.id}
          allTemplates={allTemplates}
          initialAllowed={store.allowedTemplates ?? null}
        />
      </SectionCard>

      {/* ── Section 5: Billing ── */}
      <SectionCard
        title="Billing"
        description="Plan, subscription status, and manual invoice history. See docs/SUBSCRIPTIONS_PLAN.md."
      >
        <BillingClient
          storeId={store.id}
          plan={store.plan}
          subscriptionStatus={store.subscriptionStatus}
          trialEndsAt={store.trialEndsAt}
          nextBillingAt={store.nextBillingAt}
          plans={allPlans}
          invoices={invoices}
        />
      </SectionCard>

      {/* ── Section 6: Team ── */}
      <StoreAdmins storeId={store.id} storeName={store.name} admins={admins} />

      {/* ── Section 7: Delete / restore ── */}
      <DeleteStoreSection
        storeId={store.id}
        storeName={store.name}
        isDeleted={store.status === 'deleted' || !!store.deletedAt}
        deletedAt={store.deletedAt}
        previousId={store.previousId}
      />

    </main>
  );
}
