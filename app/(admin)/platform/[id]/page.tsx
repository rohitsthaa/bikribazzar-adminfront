import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getStore, getStorePaymentConfig, getStoreAdmins } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import { updateStoreAction, updatePaymentConfigAction } from '../actions';
import { enterStore } from '../../store-actions';
import StoreAdmins from './StoreAdmins';
import ColorInput from './ColorInput';
import { TEMPLATES } from '../templates';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }
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
  return (
    <button
      type="submit"
      className="rounded-xl bg-stone-800 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors"
    >
      {label}
    </button>
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

export default async function StoreManagePage({ params }: Props) {
  const me = await getAdmin();
  if (me?.role !== 'super') redirect('/dashboard');

  let store;
  try { store = await getStore(params.id); } catch { notFound(); }
  if (!store) notFound();

  const [pay, admins] = await Promise.all([
    getStorePaymentConfig(params.id).catch(() => null),
    getStoreAdmins(params.id).catch(() => []),
  ]);

  const theme = (store.theme ?? {}) as ThemeShape;

  return (
    <main className="p-6 md:p-8 max-w-3xl space-y-8">

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
            <p className="text-sm text-stone-400 mt-0.5">{store.id}</p>
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
        <form action={updateStoreAction} className="space-y-5">
          <input type="hidden" name="id" value={store.id} />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Store name</Label>
              <Input name="name" defaultValue={store.name} />
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue={store.status}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Custom domain <span className="text-stone-400 font-normal">(optional)</span></Label>
              <Input name="customDomain" defaultValue={store.customDomain ?? ''} placeholder="shop.example.com" />
              <p className="text-[11px] text-stone-400 mt-1.5">Leave blank to use the default platform subdomain.</p>
            </div>
          </div>

          {/* Keep theme + fonts here too so updateStoreAction works in one form */}
          <input type="hidden" name="primary" value={theme.colors?.primary ?? ''} />
          <input type="hidden" name="accent" value={theme.colors?.accent ?? ''} />
          <input type="hidden" name="bg" value={theme.colors?.bg ?? ''} />
          <input type="hidden" name="fontDisplay" value={theme.fonts?.display ?? ''} />
          <input type="hidden" name="fontBody" value={theme.fonts?.body ?? ''} />
          <input type="hidden" name="templateId" value={store.templateId} />

          <SaveBtn />
        </form>
      </SectionCard>

      {/* ── Section 2: Template & Theme ── */}
      <SectionCard title="Template & Theme" description="Visual design applied to this store's storefront.">
        <form action={updateStoreAction} className="space-y-6">
          <input type="hidden" name="id" value={store.id} />
          <input type="hidden" name="name" value={store.name} />
          <input type="hidden" name="status" value={store.status} />
          <input type="hidden" name="customDomain" value={store.customDomain ?? ''} />

          <div>
            <Label>Template</Label>
            <Select name="templateId" defaultValue={store.templateId}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <p className="text-[11px] text-stone-400 mt-1.5">Changing this updates the storefront layout immediately.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-stone-600 mb-3">
              Theme overrides <span className="text-stone-400 font-normal">— leave blank to use template defaults</span>
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <ColorInput name="primary" label="Primary colour" defaultValue={theme.colors?.primary} placeholder="#c96a3a" />
              <ColorInput name="accent"  label="Accent colour"  defaultValue={theme.colors?.accent}  placeholder="#3d2c1e" />
              <ColorInput name="bg"      label="Background"     defaultValue={theme.colors?.bg}      placeholder="#faf8f5" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Display font <span className="text-stone-400 font-normal">(Google Fonts name)</span></Label>
              <Input name="fontDisplay" defaultValue={theme.fonts?.display ?? ''} placeholder="Cormorant Garamond" />
            </div>
            <div>
              <Label>Body font <span className="text-stone-400 font-normal">(Google Fonts name)</span></Label>
              <Input name="fontBody" defaultValue={theme.fonts?.body ?? ''} placeholder="Inter" />
            </div>
          </div>

          <SaveBtn />
        </form>
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

      {/* ── Section 4: Team ── */}
      <StoreAdmins storeId={store.id} storeName={store.name} admins={admins} />

    </main>
  );
}
