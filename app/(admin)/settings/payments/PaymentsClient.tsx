'use client';

import { useState, useTransition } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { SettingCard, Field } from '@/components/SettingCard';
import { savePaymentQr, savePaymentGateways, testFonepay } from '../actions';
import type { PaymentGatewayConfigView } from '@/lib/api';

// Maps the API's step ids onto something a store owner can act on.
const LABELS: Record<string, string> = {
  key: 'Private key',
  login: 'Sign in',
  qr: 'QR generation',
};

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
  const [gatewaysSaved, setGatewaysSaved] = useState(false);
  const [gatewaysError, setGatewaysError] = useState('');
  const [gatewaysPending, startGatewaysTransition] = useTransition();

  // Connection test: runs against the live gateway without saving, so a bad key is caught here
  // rather than by a customer at checkout. Fields left blank fall back to what's already saved.
  const [fpTesting, setFpTesting] = useState(false);
  const [fpResult, setFpResult] = useState<{ ok: boolean; steps: { name: string; ok: boolean; detail: string }[] } | null>(null);

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
    <div className="space-y-5">
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

      <SettingCard
        title="Payment gateways"
        description="Connect your own eSewa, Khalti, and Fonepay merchant accounts so customers can pay online at checkout."
        onSave={handleGatewaysSave}
        isPending={gatewaysPending}
        saved={gatewaysSaved}
      >
        {/* eSewa */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
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
            </>
          )}
        </div>

        {/* Khalti */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
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
            </>
          )}
        </div>

        {/* Fonepay */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
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

              {fpResult && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs space-y-1 ${
                    fpResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  {fpResult.steps.map((st) => (
                    <div key={st.name} className="flex gap-2">
                      <span className={st.ok ? 'text-green-600' : 'text-red-600'}>{st.ok ? '✓' : '✗'}</span>
                      <span className="text-stone-700">
                        <span className="font-medium capitalize">{LABELS[st.name] ?? st.name}</span>
                        {' — '}{st.detail}
                      </span>
                    </div>
                  ))}
                  {fpResult.ok && (
                    <p className="text-green-700 font-medium pt-0.5">
                      Fonepay is working. Customers can pay with it at checkout.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {gatewaysError && <p className="text-xs text-red-600">{gatewaysError}</p>}
      </SettingCard>

      {gatewaysError && <p className="text-xs text-red-600">{gatewaysError}</p>}
    </div>
  );
}
