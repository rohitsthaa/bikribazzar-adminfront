'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import { saveAboutImage, savePaymentQr, saveContactInfo, saveCurrency, saveBranding, savePaymentGateways, testFonepay } from './actions';
import type { PaymentGatewayConfigView } from '@/lib/api';

function SettingCard({
  title,
  description,
  children,
  onSave,
  isPending,
  saved,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  isPending: boolean;
  saved: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      {children}
      <div className="flex items-center justify-between pt-2">
        <span className={`text-xs font-medium transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
          ✓ Saved
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="relative overflow-hidden px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-colors font-medium"
        >
          {isPending && (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[3px] bg-white/40 origin-left animate-progress"
            />
          )}
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300 ${mono ? 'font-mono tracking-wide' : ''}`}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// Maps the API's step ids onto something a store owner can act on.
const LABELS: Record<string, string> = {
  key: 'Private key',
  login: 'Sign in',
  qr: 'QR generation',
};

export default function SettingsClient({
  initialAboutImage,
  initialPaymentQr,
  initialBankTransferEnabled,
  initialPhone,
  initialInstagram,
  initialContactEmail,
  initialLocation,
  initialCurrency,
  initialTagline,
  initialMetaDescription,
  initialFontFamily,
  initialLogoUrl,
  initialOgImage,
  initialPaymentGateways,
}: {
  initialAboutImage: string;
  initialPaymentQr: string;
  initialBankTransferEnabled: boolean;
  initialPhone: string;
  initialInstagram: string;
  initialContactEmail: string;
  initialLocation: string;
  initialCurrency: string;
  initialTagline: string;
  initialMetaDescription: string;
  initialFontFamily: string;
  initialLogoUrl: string;
  initialOgImage: string;
  initialPaymentGateways: PaymentGatewayConfigView;
}) {
  // About image
  const [aboutImage, setAboutImage] = useState(initialAboutImage);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutPending, startAboutTransition] = useTransition();

  // Payment QR + the bank-transfer checkout toggle it controls
  const [paymentQr, setPaymentQr] = useState(initialPaymentQr);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(initialBankTransferEnabled);
  const [qrSaved, setQrSaved] = useState(false);
  const [qrPending, startQrTransition] = useTransition();

  // Contact info — no Soul-Thread placeholders; each store sets its own.
  const [phone, setPhone] = useState(initialPhone);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [location, setLocation] = useState(initialLocation);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactPending, startContactTransition] = useTransition();

  // Branding & SEO
  const [tagline, setTagline] = useState(initialTagline);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [ogImage, setOgImage] = useState(initialOgImage);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingPending, startBrandingTransition] = useTransition();

  function handleBrandingSave() {
    startBrandingTransition(async () => {
      await saveBranding({ tagline, metaDescription, fontFamily, logoUrl, ogImage });
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    });
  }

  // Currency
  const [currency, setCurrency] = useState(initialCurrency || 'NPR');
  const [currencySaved, setCurrencySaved] = useState(false);
  const [currencyPending, startCurrencyTransition] = useTransition();

  function handleCurrencySave() {
    startCurrencyTransition(async () => {
      await saveCurrency(currency);
      setCurrencySaved(true);
      setTimeout(() => setCurrencySaved(false), 2000);
    });
  }

  function handleAboutSave() {
    startAboutTransition(async () => {
      await saveAboutImage(aboutImage);
      setAboutSaved(true);
      setTimeout(() => setAboutSaved(false), 2000);
    });
  }

  function handleQrSave() {
    startQrTransition(async () => {
      await savePaymentQr(paymentQr, bankTransferEnabled);
      setQrSaved(true);
      setTimeout(() => setQrSaved(false), 2000);
    });
  }

  function handleContactSave() {
    startContactTransition(async () => {
      await saveContactInfo(phone, instagram, contactEmail, location);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    });
  }

  // Payment gateways (eSewa/Khalti/Fonepay) — self-serve merchant credentials
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
  const [gatewaysSaved, setGatewaysSaved] = useState(false);
  const [gatewaysError, setGatewaysError] = useState('');
  const [gatewaysPending, startGatewaysTransition] = useTransition();

  function handleGatewaysSave() {
    startGatewaysTransition(async () => {
      // savePaymentGateways returns { ok, error? } rather than throwing — a thrown Server
      // Action error gets its message redacted by Next.js in production builds, which is
      // exactly the generic "Server Components render" crash this replaces.
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
      setGatewaysError('');
      setGatewaysSaved(true);
      setTimeout(() => setGatewaysSaved(false), 2000);
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Contact Info */}
      <SettingCard
        title="Contact & social info"
        description="Phone number, Instagram URL, email and location shown across the site."
        onSave={handleContactSave}
        isPending={contactPending}
        saved={contactSaved}
      >
        <Field
          label="Phone number"
          value={phone}
          onChange={setPhone}
          placeholder="9841234567"
          mono
          hint="Your store's contact number."
        />
        <Field
          label="Instagram URL"
          value={instagram}
          onChange={setInstagram}
          placeholder="https://www.instagram.com/yourhandle/"
        />
        <Field
          label="Contact email"
          value={contactEmail}
          onChange={setContactEmail}
          placeholder="hello@yourstore.com"
        />
        <Field
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="City, Country"
        />
      </SettingCard>

      {/* Branding & SEO */}
      <SettingCard
        title="Branding & SEO"
        description="Your store's tagline, search/social description, logo, and font. Shown in the browser tab, Google results, and social shares."
        onSave={handleBrandingSave}
        isPending={brandingPending}
        saved={brandingSaved}
      >
        <Field
          label="Tagline"
          value={tagline}
          onChange={setTagline}
          placeholder="e.g. Handmade goods, delivered with care"
          hint="Appears after your store name in the title and hero/footer."
        />
        <Field
          label="Search description (meta description)"
          value={metaDescription}
          onChange={setMetaDescription}
          placeholder="One or two sentences describing your store."
          hint="Used by Google and social previews. Falls back to your tagline."
        />
        <Field
          label="Font (Google Fonts family name)"
          value={fontFamily}
          onChange={setFontFamily}
          placeholder="e.g. Poppins, Playfair Display"
          hint="Optional. Must match a Google Fonts family name exactly."
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Logo / favicon</label>
          <ImageUploader value={logoUrl} onChange={setLogoUrl} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Social share image (Open Graph)</label>
          <ImageUploader value={ogImage} onChange={setOgImage} />
        </div>
      </SettingCard>

      {/* Currency */}
      <SettingCard
        title="Currency"
        description="Symbol displayed next to all prices on the storefront, order confirmation, emails, and admin pages."
        onSave={handleCurrencySave}
        isPending={currencyPending}
        saved={currencySaved}
      >
        <Field
          label="Currency symbol"
          value={currency}
          onChange={setCurrency}
          placeholder="NPR"
          mono
          hint='e.g. NPR, $, €, £, ₹. Just the symbol — it appears before the amount.'
        />
      </SettingCard>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-gray-900">Product categories</h3>
          <p className="text-sm text-gray-500 mt-0.5">Categories shown in the shop filter and product form now have their own page.</p>
        </div>
        <Link
          href="/categories"
          className="shrink-0 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm rounded-xl transition-colors font-medium"
        >
          Manage categories →
        </Link>
      </div>

      {/* About image */}
      <SettingCard
        title="About / Story band image"
        description='Shown on the homepage next to "One thread, one knot, at a time."'
        onSave={handleAboutSave}
        isPending={aboutPending}
        saved={aboutSaved}
      >
        <ImageUploader value={aboutImage} onChange={setAboutImage} />
      </SettingCard>

      {/* Payment QR / bank transfer toggle */}
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

      {/* Payment gateways (self-serve merchant credentials) */}
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
    </div>
  );
}
