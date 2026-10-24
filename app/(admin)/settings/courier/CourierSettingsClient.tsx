'use client';

import { useState, useTransition, type FormEvent } from 'react';
import type { StoreCourierConfigView } from '@/lib/api';
import { saveCourierConfig } from '../actions';

const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

export default function CourierSettingsClient({
  initialConfig,
  isDemo,
}: {
  initialConfig: StoreCourierConfigView['ncm'];
  isDemo: boolean;
}) {
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [fromBranch, setFromBranch] = useState(initialConfig.fromBranch);
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaved(false);
    startTransition(async () => {
      const result = await saveCourierConfig({ ncmEnabled: enabled, ncmFromBranch: fromBranch, ncmToken: token });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setToken('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <header className="border-b border-stone-100 px-6 py-5">
        <h2 className="font-semibold text-stone-900">Courier — NCM (Nepal Can Move)</h2>
        <p className="mt-1 text-sm text-stone-400">Your vendor token is encrypted and never shown after saving.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        {isDemo && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            This is a demo store. Shipments use NCM&apos;s demo/UAT server by default. The real-host testing override is managed by the platform administrator.
          </div>
        )}

        <div className="rounded-xl border border-stone-100 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#c96a3a]"
            />
            <span>
              <span className="block text-sm font-medium text-stone-900">Enable NCM shipping</span>
              <span className="mt-0.5 block text-sm text-stone-500">Ship orders via NCM from the order detail page.</span>
            </span>
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Pickup branch
              <input
                value={fromBranch}
                onChange={(event) => setFromBranch(event.target.value)}
                placeholder="e.g. TINKUNE"
                className={inputClass}
                autoComplete="off"
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Vendor token {initialConfig.hasToken && <span className="font-normal text-emerald-600">· set</span>}
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                type="password"
                placeholder={initialConfig.hasToken ? 'Leave blank to keep current' : 'Paste NCM API token'}
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
          </div>

          {enabled && (
            <p className="mt-4 text-xs text-stone-500">
              Status updates:{' '}
              {initialConfig.webhookRegistered ? (
                <span className="text-emerald-600">NCM webhook registered</span>
              ) : (
                <span className="text-amber-700">webhook not registered; use manual status sync on each order</span>
              )}
            </p>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="text-sm text-emerald-700">Courier settings saved.</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save courier settings'}
        </button>
      </form>
    </section>
  );
}
