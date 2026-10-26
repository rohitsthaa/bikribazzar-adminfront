'use client';

import { useState, useTransition } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { SettingCard, Field } from '@/components/SettingCard';
import { savePaymentQr, savePaymentGateways, testFonepay, testEsewa, testKhalti } from '../actions';
import type { ConnectionTestResult, PaymentGatewayConfigView } from '@/lib/api';

// Maps the API's step ids onto something a store owner can act on.
const LABELS: Record<string, string> = {
  key: 'Private key',
  login: 'Sign in',
  qr: 'QR generation',
  signing: 'Signing secret',
  product: 'Product code',
  token: 'Vendor token',
  branch: 'Pickup branch',
  server: 'Connection',
};

function ConnectionTestNotice({ result, successMessage = 'Connection check passed.' }: { result: ConnectionTestResult; successMessage?: string }) {
  return (
    <div aria-live="polite" className={`rounded-lg border px-3 py-2 text-xs space-y-1 ${result.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      {result.steps.map((step) => (
        <div key={step.name} className="flex gap-2">
          <span className={step.ok ? 'text-green-600' : 'text-red-600'}>{step.ok ? '✓' : '✗'}</span>
          <span className="text-stone-700"><span className="font-medium">{LABELS[step.name] ?? step.name}</span>{' — '}{step.detail}</span>
        </div>
      ))}
      {result.ok && <p className="pt-0.5 font-medium text-green-700">{successMessage}</p>}
    </div>
  );
}

/**
 * Everything about taking money, on one page of its own.
 *
 * These two cards used to sit at the bottom of /settings underneath contact details, SEO and
 * an about-page image. They are the highest-stakes settings a store owner touches — a mistyped
 * private key breaks checkout for real customers — and they were the furthest from the top.
 */
export default function PaymentsClient({
  initialPaymentQr,
  initialBankTransferEnabled,
  initialPaymentGateways,
}: {
  initialPaymentQr: string;
  initialBankTransferEnabled: boolean;
  initialPaymentGateways: PaymentGatewayConfigView;
}) {
  const [activePaymentMethod, setActivePaymentMethod] = useState<'bank' | 'esewa' | 'khalti' | 'fonepay'>('bank');
  // Payment QR
  const [paymentQr, setPaymentQr] = useState(initialPaymentQr);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(initialBankTransferEnabled);
  const [qrSaved, setQrSaved] = useState(false);
  const [qrPending, startQrTransition] = useTransition();

  function handleQrSave() {
    startQrTransition(async () => {
      await savePaymentQr(paymentQr, bankTransferEnabled);
      setQrSaved(true);
      setTimeout(() => setQrSaved(false), 2000);
    });
  }

  // Online gateways — self-serve merchant credentials
  const [esewaEnabled, setEsewaEnabled] = useState(initialPaymentGateways.esewa.enabled);
  const [esewaGwMode, setEsewaGwMode] = useState(initialPaymentGateways.esewa.mode);
  const [esewaProductCodeGw, setEsewaProductCodeGw] = useState(initialPaymentGateways.esewa.productCode);
  const [esewaSecretGw, setEsewaSecretGw] = useState('');
  const [khaltiEnabledGw, setKhaltiEnabledGw] = useState(initialPaymentGateways.khalti.enabled);
  const [khaltiModeGw, setKhaltiModeGw] = useState(initialPaymentGateways.khalti.mode);
  const [khaltiSecretGw, setKhaltiSecretGw] = useState('');
  const [fonepayEnabled, setFonepayEnabled] = useState(initialPaymentGateways.fonepay.enabled);
  const [fonepayModeGw, setFonepayModeGw] = useState(initialPaymentGateways.fonepay.mode);
  const [fonepayTerminalId, setFonepayTerminalId] = useState(initialPaymentGateways.fonepay.terminalId);
  const [fonepayUsername, setFonepayUsername] = useState('');
  const [fonepayPassword, setFonepayPassword] = useState('');
  const [fonepayPrivateKey, setFonepayPrivateKey] = useState('');
  const [esewaTesting, setEsewaTesting] = useState(false);
  const [esewaTestResult, setEsewaTestResult] = useState<ConnectionTestResult | null>(null);
  const [khaltiTesting, setKhaltiTesting] = useState(false);
  const [khaltiTestResult, setKhaltiTestResult] = useState<ConnectionTestResult | null>(null);
  const [gatewaysSaved, setGatewaysSaved] = useState(false);
  const [gatewaysError, setGatewaysError] = useState('');
  const [gatewaysPending, startGatewaysTransition] = useTransition();

  // Connection checks run against the selected gateway mode without saving. Fields left blank
  // fall back to what's already saved.
  const [fpTesting, setFpTesting] = useState(false);
  const [fpResult, setFpResult] = useState<ConnectionTestResult | null>(null);

  async function handleEsewaTest() {
    setEsewaTesting(true);
    setEsewaTestResult(null);
    try {
      setEsewaTestResult(await testEsewa({ mode: esewaGwMode, productCode: esewaProductCodeGw, secret: esewaSecretGw }));
    } finally {
      setEsewaTesting(false);
    }
  }

  async function handleKhaltiTest() {
    setKhaltiTesting(true);
    setKhaltiTestResult(null);
    try {
      setKhaltiTestResult(await testKhalti({ mode: khaltiModeGw, secret: khaltiSecretGw }));
    } finally {
      setKhaltiTesting(false);
    }
  }

  async function handleFonepayTest() {
    setFpTesting(true);
    setFpResult(null);
    try {
      setFpResult(await testFonepay({
        terminalId: fonepayTerminalId, username: fonepayUsername,
        password: fonepayPassword, privateKey: fonepayPrivateKey,
      }));
    } finally {
      setFpTesting(false);
    }
  }

  function handleGatewaysSave() {
    startGatewaysTransition(async () => {
      setGatewaysError('');
      // savePaymentGateways returns { ok, error? } rather than throwing — a thrown Server
      // Action error is redacted by Next.js in production, losing the real message.
      const result = await savePaymentGateways({
        esewaEnabled, esewaMode: esewaGwMode, esewaProductCode: esewaProductCodeGw, esewaSecret: esewaSecretGw,
        khaltiEnabled: khaltiEnabledGw, khaltiMode: khaltiModeGw, khaltiSecret: khaltiSecretGw,
        fonepayEnabled, fonepayMode: fonepayModeGw, fonepayTerminalId,
        fonepayUsername, fonepayPassword, fonepayPrivateKey,
      });
      if (!result.ok) {
        setGatewaysError(result.error);
        return;
      }
      setEsewaSecretGw(''); setKhaltiSecretGw('');
      setFonepayUsername(''); setFonepayPassword(''); setFonepayPrivateKey('');
      setGatewaysSaved(true);
      setTimeout(() => setGatewaysSaved(false), 2000);
    });
  }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="border-b border-gray-200">
        <div role="tablist" aria-label="Payment methods" className="flex gap-2 overflow-x-auto">
          {[
            { id: 'bank', label: 'Bank transfer' },
            ...(initialPaymentGateways.esewa.available ? [{ id: 'esewa', label: 'eSewa' }] : []),
            ...(initialPaymentGateways.khalti.available ? [{ id: 'khalti', label: 'Khalti' }] : []),
            ...(initialPaymentGateways.fonepay.available ? [{ id: 'fonepay', label: 'Fonepay' }] : []),
          ].map((method) => (
            <button
              key={method.id}
              id={`payment-tab-${method.id}`}
              type="button"
              role="tab"
              aria-selected={activePaymentMethod === method.id}
              aria-controls={method.id === 'bank' ? 'payment-panel-bank' : 'payment-panel-online'}
              onClick={() => setActivePaymentMethod(method.id as typeof activePaymentMethod)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activePaymentMethod === method.id ? 'border-[#c96a3a] text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>
      {!initialPaymentGateways.esewa.available && !initialPaymentGateways.khalti.available && !initialPaymentGateways.fonepay.available && (
        <p className="text-sm text-gray-500">Online payment gateways are currently disabled by your platform administrator.</p>
      )}
      <section id="payment-panel-bank" role="tabpanel" aria-labelledby="payment-tab-bank" hidden={activePaymentMethod !== 'bank'}>
      <SettingCard
        title="Payment QR code"
        description="Scan-to-pay QR shown on the order confirmation page. Enable below to also offer &ldquo;Bank transfer&rdquo; as a payment option at checkout."
        onSave={handleQrSave}
        isPending={qrPending}
        saved={qrSaved}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Enable bank transfer</p>
            <p className="text-xs text-gray-400 mt-0.5">Shows &ldquo;Bank transfer&rdquo; as a payment method at checkout.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={bankTransferEnabled}
            onClick={() => setBankTransferEnabled((v) => !v)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 ${
              bankTransferEnabled ? 'bg-stone-800' : 'bg-stone-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                bankTransferEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <ImageUploader value={paymentQr} onChange={setPaymentQr} />
        {paymentQr && (
          <div className="mt-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/image?src=${encodeURIComponent(paymentQr)}`}
              alt="Payment QR preview"
              className="w-40 h-40 object-contain border border-gray-200 rounded-xl bg-white p-2"
            />
          </div>
        )}
      </SettingCard>
      </section>

      <section id="payment-panel-online" role="tabpanel" aria-labelledby={`payment-tab-${activePaymentMethod}`} hidden={activePaymentMethod === 'bank'}>
      <SettingCard
        title="Payment gateways"
        description="Connect your own eSewa, Khalti, and Fonepay merchant accounts so customers can pay online at checkout."
        onSave={handleGatewaysSave}
        isPending={gatewaysPending}
        saved={gatewaysSaved}
      >
        {/* eSewa */}
        <div hidden={activePaymentMethod !== 'esewa'} className="border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-800">eSewa</p>
            <button
              type="button"
              role="switch"
              aria-checked={esewaEnabled}
              onClick={() => setEsewaEnabled((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 ${
                esewaEnabled ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  esewaEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {esewaEnabled && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Mode</label>
                <select
                  value={esewaGwMode}
                  onChange={(e) => setEsewaGwMode(e.target.value as 'test' | 'production')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <option value="test">Test (sandbox)</option>
                  <option value="production">Production (live)</option>
                </select>
              </div>
              <Field label="Merchant product code" value={esewaProductCodeGw} onChange={setEsewaProductCodeGw} placeholder="EPAYTEST" mono />
              <Field
                label="Merchant secret key"
                value={esewaSecretGw}
                onChange={setEsewaSecretGw}
                placeholder={initialPaymentGateways.esewa.hasSecret ? 'Already saved — enter to replace' : 'Enter your eSewa secret key'}
                mono
              />
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleEsewaTest}
                  disabled={esewaTesting}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  {esewaTesting ? 'Testing…' : 'Test connection'}
                </button>
                <span className="text-xs text-stone-400">Checks eSewa’s status service and product code. The secret can’t be validated without starting a payment.</span>
              </div>
              {esewaTestResult && <ConnectionTestNotice result={esewaTestResult} />}
            </>
          )}
        </div>

        {/* Khalti */}
        <div hidden={activePaymentMethod !== 'khalti'} className="border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-800">Khalti</p>
            <button
              type="button"
              role="switch"
              aria-checked={khaltiEnabledGw}
              onClick={() => setKhaltiEnabledGw((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 ${
                khaltiEnabledGw ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  khaltiEnabledGw ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {khaltiEnabledGw && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Mode</label>
                <select
                  value={khaltiModeGw}
                  onChange={(e) => setKhaltiModeGw(e.target.value as 'test' | 'production')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <option value="test">Test (sandbox)</option>
                  <option value="production">Production (live)</option>
                </select>
              </div>
              <Field
                label="Live secret key"
                value={khaltiSecretGw}
                onChange={setKhaltiSecretGw}
                placeholder={initialPaymentGateways.khalti.hasSecret ? 'Already saved — enter to replace' : 'Enter your Khalti secret key'}
                mono
              />
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleKhaltiTest}
                  disabled={khaltiTesting}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  {khaltiTesting ? 'Testing…' : 'Test connection'}
                </button>
                <span className="text-xs text-stone-400">Checks this key with Khalti’s read-only payment lookup. No payment is created.</span>
              </div>
              {khaltiTestResult && <ConnectionTestNotice result={khaltiTestResult} />}
            </>
          )}
        </div>

        {/* Fonepay */}
        <div hidden={activePaymentMethod !== 'fonepay'} className="border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-800">Fonepay</p>
            <button
              type="button"
              role="switch"
              aria-checked={fonepayEnabled}
              onClick={() => setFonepayEnabled((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 ${
                fonepayEnabled ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  fonepayEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {fonepayEnabled && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Mode</label>
                <select
                  value={fonepayModeGw}
                  onChange={(e) => setFonepayModeGw(e.target.value as 'test' | 'production')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <option value="test">Test (sandbox)</option>
                  <option value="production">Production (live)</option>
                </select>
              </div>
              <Field label="Terminal ID" value={fonepayTerminalId} onChange={setFonepayTerminalId} placeholder="4271423331147924" mono />
              <Field
                label="Username"
                value={fonepayUsername}
                onChange={setFonepayUsername}
                placeholder={initialPaymentGateways.fonepay.hasUsername ? 'Already saved — enter to replace' : 'Enter your Fonepay username'}
                mono
              />
              <Field
                label="Password"
                value={fonepayPassword}
                onChange={setFonepayPassword}
                placeholder={initialPaymentGateways.fonepay.hasPassword ? 'Already saved — enter to replace' : 'Enter your Fonepay password'}
                mono
              />
              <Field
                label="Private key"
                value={fonepayPrivateKey}
                onChange={setFonepayPrivateKey}
                placeholder={initialPaymentGateways.fonepay.hasPrivateKey ? 'Already saved — enter to replace' : 'Enter your Fonepay PKCS8 private key'}
                mono
                hint="Paste the key from Fonepay's merchant portal. A whole .pem file is fine — the BEGIN/END lines are stripped for you."
              />

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleFonepayTest}
                  disabled={fpTesting}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  {fpTesting ? 'Testing…' : 'Test connection'}
                </button>
                <span className="ml-2 text-xs text-stone-400">
                  Checks these credentials against Fonepay. Nothing is saved or charged.
                </span>
              </div>

              {fpResult && <ConnectionTestNotice result={fpResult} successMessage="Fonepay is working. Customers can pay with it at checkout." />}
            </>
          )}
        </div>

        {gatewaysError && <p className="text-xs text-red-600">{gatewaysError}</p>}
      </SettingCard>
      </section>

    </div>
  );
}
