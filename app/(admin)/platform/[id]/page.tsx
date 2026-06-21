import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStore, getStorePaymentConfig } from '@/lib/api';
import { updateStoreAction, updatePaymentConfigAction } from '../actions';
import { TEMPLATES } from '../templates';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

type ThemeShape = { colors?: { primary?: string; accent?: string; bg?: string }; fonts?: { display?: string; body?: string } };

export default async function StoreManagePage({ params }: Props) {
  let store;
  try { store = await getStore(params.id); } catch { notFound(); }
  if (!store) notFound();
  const pay = await getStorePaymentConfig(params.id).catch(() => null);

  const theme = (store.theme ?? {}) as ThemeShape;
  const input = 'mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm';
  const label = 'block text-sm';

  return (
    <main className="p-6 md:p-8 max-w-3xl space-y-8">
      <div>
        <Link href="/platform" className="text-sm text-stone-400 hover:text-stone-700">← All stores</Link>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-3">{store.name}</h1>
        <p className="text-stone-400 text-sm">{store.id}</p>
      </div>

      {/* Store settings */}
      <form action={updateStoreAction} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold text-stone-900">Store settings</h2>
        <input type="hidden" name="id" value={store.id} />
        <div className="grid sm:grid-cols-2 gap-4">
          <label className={label}><span className="text-stone-500">Name</span>
            <input name="name" defaultValue={store.name} className={input} /></label>
          <label className={label}><span className="text-stone-500">Status</span>
            <select name="status" defaultValue={store.status} className={input}>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
            </select></label>
          <label className={label}><span className="text-stone-500">Template</span>
            <select name="templateId" defaultValue={store.templateId} className={input}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></label>
          <label className={label}><span className="text-stone-500">Custom domain</span>
            <input name="customDomain" defaultValue={store.customDomain ?? ''} placeholder="shop.example.com" className={input} /></label>
        </div>

        <p className="text-xs uppercase tracking-wide text-stone-400 pt-2">Theme</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className={label}><span className="text-stone-500">Primary</span>
            <input name="primary" defaultValue={theme.colors?.primary ?? ''} placeholder="#6d28d9" className={input} /></label>
          <label className={label}><span className="text-stone-500">Accent</span>
            <input name="accent" defaultValue={theme.colors?.accent ?? ''} placeholder="#db2777" className={input} /></label>
          <label className={label}><span className="text-stone-500">Background</span>
            <input name="bg" defaultValue={theme.colors?.bg ?? ''} placeholder="#ffffff" className={input} /></label>
          <label className={label}><span className="text-stone-500">Display font</span>
            <input name="fontDisplay" defaultValue={theme.fonts?.display ?? ''} className={input} /></label>
          <label className={label}><span className="text-stone-500">Body font</span>
            <input name="fontBody" defaultValue={theme.fonts?.body ?? ''} className={input} /></label>
        </div>
        <button className="rounded-lg bg-stone-800 text-white px-4 py-2 text-sm font-medium hover:bg-stone-700">Save settings</button>
      </form>

      {/* Payment config */}
      <form action={updatePaymentConfigAction} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold text-stone-900">Payment credentials</h2>
        <input type="hidden" name="id" value={store.id} />

        <div className="rounded-xl border border-stone-100 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
            <input type="checkbox" name="esewaEnabled" defaultChecked={pay?.esewaEnabled} /> eSewa enabled
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className={label}><span className="text-stone-500">Mode</span>
              <select name="esewaMode" defaultValue={pay?.esewaMode ?? 'test'} className={input}>
                <option value="test">test</option><option value="production">production</option>
              </select></label>
            <label className={label}><span className="text-stone-500">Product / merchant code</span>
              <input name="esewaProductCode" defaultValue={pay?.esewaProductCode ?? ''} placeholder="EPAYTEST" className={input} /></label>
          </div>
          <label className={label}><span className="text-stone-500">Secret {pay?.hasEsewaSecret && <em className="text-green-600 not-italic">· set</em>}</span>
            <input name="esewaSecret" type="password" placeholder={pay?.hasEsewaSecret ? '•••••• (leave blank to keep)' : 'paste secret'} className={input} /></label>
        </div>

        <div className="rounded-xl border border-stone-100 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
            <input type="checkbox" name="khaltiEnabled" defaultChecked={pay?.khaltiEnabled} /> Khalti enabled
          </label>
          <label className={label}><span className="text-stone-500">Mode</span>
            <select name="khaltiMode" defaultValue={pay?.khaltiMode ?? 'test'} className={input}>
              <option value="test">test</option><option value="production">production</option>
            </select></label>
          <label className={label}><span className="text-stone-500">Secret key {pay?.hasKhaltiSecret && <em className="text-green-600 not-italic">· set</em>}</span>
            <input name="khaltiSecret" type="password" placeholder={pay?.hasKhaltiSecret ? '•••••• (leave blank to keep)' : 'paste live_secret_key'} className={input} /></label>
        </div>

        <button className="rounded-lg bg-stone-800 text-white px-4 py-2 text-sm font-medium hover:bg-stone-700">Save payment config</button>
        <p className="text-xs text-stone-400">Secrets are encrypted at rest and never shown again.</p>
      </form>
    </main>
  );
}
