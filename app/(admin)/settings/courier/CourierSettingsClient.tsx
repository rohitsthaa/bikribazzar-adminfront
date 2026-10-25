'use client';

import { useState, useTransition, type FormEvent } from 'react';
import type { StoreCourierConfigView } from '@/lib/api';
import type { ConnectionTestResult } from '@/lib/api';
import { saveCourierConfig, testNcm } from '../actions';

const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

export default function CourierSettingsClient({
  initialConfig,
  isDemo,
}: {
  initialConfig: StoreCourierConfigView['ncm'];
  isDemo: boolean;
}) {
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [mode, setMode] = useState<'test' | 'production'>(initialConfig.mode);
  const forcedTestMode = isDemo && !initialConfig.forceRealHost;
  const [fromBranch, setFromBranch] = useState(initialConfig.fromBranch);
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [testPending, setTestPending] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  async function handleTestConnection() {
    setTestPending(true);
    setTestResult(null);
    try {
      setTestResult(await testNcm({
        mode: forcedTestMode ? 'test' : mode,
        fromBranch,
        token,
      }));
    } finally {
      setTestPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaved(false);
    startTransition(async () => {
      const result = await saveCourierConfig({ ncmEnabled: enabled, ncmMode: forcedTestMode ? 'test' : mode, ncmFromBranch: fromBranch, ncmToken: token });
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
            This is a demo store. NCM always uses its demo/UAT server unless the platform administrator enables the real-host override.
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

          <label className="mt-5 block max-w-sm text-sm font-medium text-stone-700">
            Mode
            <select
              value={forcedTestMode ? 'test' : mode}
              onChange={(event) => setMode(event.target.value as 'test' | 'production')}
              disabled={forcedTestMode}
              className={inputClass}
            >
              <option value="test">Test (NCM demo/UAT)</option>
              <option value="production">Production</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-stone-500">
              {forcedTestMode
                ? "Demo stores use NCM's demo server. Only a platform administrator can enable live-host access."
                : 'Test mode sends courier requests to NCM&apos;s demo server. Live bookings require Production mode and your live NCM account.'}
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

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testPending}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:cursor-wait disabled:opacity-60"
          >
            {testPending ? 'Testing…' : 'Test connection'}
          </button>
          <span className="text-xs text-stone-500">Checks the token and pickup branch using NCM’s read-only rate list. No shipment is created.</span>
          {testResult && (
            <div aria-live="polite" className={`basis-full rounded-lg border px-3 py-2 text-xs space-y-1 ${testResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {testResult.steps.map((step) => (
                <div key={step.name} className="flex gap-2">
                  <span className={step.ok ? 'text-green-600' : 'text-red-600'}>{step.ok ? '✓' : '✗'}</span>
                  <span className="text-stone-700"><span className="font-medium capitalize">{step.name}</span>{' — '}{step.detail}</span>
                </div>
              ))}
              {testResult.ok && <p className="pt-0.5 font-medium text-green-700">NCM connection check passed.</p>}
            </div>
          )}
        </div>

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
