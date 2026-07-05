'use client';

import { useState, useTransition } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { saveAboutImage, savePaymentQr, saveBankDetails, saveContactInfo, saveCategories, saveCurrency, saveBranding, saveDeliveryFees } from './actions';

const DEFAULT_CATEGORIES = [
  { key: 'shelf', label: 'Hanging Shelves' },
  { key: 'hanger', label: 'Plant Hangers' },
  { key: 'wall', label: 'Wall Hangings' },
  { key: 'custom', label: 'Custom Orders' },
];

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

export default function SettingsClient({
  initialAboutImage,
  initialPaymentQr,
  initialBankName,
  initialAccountName,
  initialAccountNo,
  initialWhatsapp,
  initialInstagram,
  initialContactEmail,
  initialLocation,
  initialCategories,
  initialCurrency,
  initialTagline,
  initialMetaDescription,
  initialFontFamily,
  initialLogoUrl,
  initialOgImage,
  initialValleyFee,
  initialNationwideFee,
}: {
  initialAboutImage: string;
  initialPaymentQr: string;
  initialBankName: string;
  initialAccountName: string;
  initialAccountNo: string;
  initialWhatsapp: string;
  initialInstagram: string;
  initialContactEmail: string;
  initialLocation: string;
  initialCategories: string;
  initialCurrency: string;
  initialTagline: string;
  initialMetaDescription: string;
  initialFontFamily: string;
  initialLogoUrl: string;
  initialOgImage: string;
  initialValleyFee: string;
  initialNationwideFee: string;
}) {
  // About image
  const [aboutImage, setAboutImage] = useState(initialAboutImage);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutPending, startAboutTransition] = useTransition();

  // Payment QR
  const [paymentQr, setPaymentQr] = useState(initialPaymentQr);
  const [qrSaved, setQrSaved] = useState(false);
  const [qrPending, startQrTransition] = useTransition();

  // Bank details
  const [bankName, setBankName] = useState(initialBankName);
  const [accountName, setAccountName] = useState(initialAccountName);
  const [accountNo, setAccountNo] = useState(initialAccountNo);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankPending, startBankTransition] = useTransition();

  // Contact info — no Soul-Thread placeholders; each store sets its own.
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
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

  // Delivery fees — defaults used at checkout when a product has no fee
  // override of its own (see the Pricing tab of the product edit form).
  const [valleyFee, setValleyFee] = useState(initialValleyFee || '0');
  const [nationwideFee, setNationwideFee] = useState(initialNationwideFee || '0');
  const [deliverySaved, setDeliverySaved] = useState(false);
  const [deliveryPending, startDeliveryTransition] = useTransition();

  function handleDeliverySave() {
    startDeliveryTransition(async () => {
      await saveDeliveryFees(valleyFee, nationwideFee);
      setDeliverySaved(true);
      setTimeout(() => setDeliverySaved(false), 2000);
    });
  }

  // Categories
  const parsedInitial = (() => {
    try { return initialCategories ? JSON.parse(initialCategories) : DEFAULT_CATEGORIES; }
    catch { return DEFAULT_CATEGORIES; }
  })();
  const [categories, setCategories] = useState<Array<{ key: string; label: string }>>(parsedInitial);
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [catSaved, setCatSaved] = useState(false);
  const [catPending, startCatTransition] = useTransition();

  function handleAboutSave() {
    startAboutTransition(async () => {
      await saveAboutImage(aboutImage);
      setAboutSaved(true);
      setTimeout(() => setAboutSaved(false), 2000);
    });
  }

  function handleQrSave() {
    startQrTransition(async () => {
      await savePaymentQr(paymentQr);
      setQrSaved(true);
      setTimeout(() => setQrSaved(false), 2000);
    });
  }

  function handleBankSave() {
    startBankTransition(async () => {
      await saveBankDetails(bankName, accountName, accountNo);
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 2000);
    });
  }

  function handleContactSave() {
    startContactTransition(async () => {
      await saveContactInfo(whatsapp, instagram, contactEmail, location);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    });
  }

  function handleCatSave() {
    startCatTransition(async () => {
      await saveCategories(categories);
      setCatSaved(true);
      setTimeout(() => setCatSaved(false), 2000);
    });
  }

  function addCategory() {
    const key = newCatKey.trim().toLowerCase().replace(/\s+/g, '-');
    const label = newCatLabel.trim();
    if (!key || !label) return;
    if (categories.some((c) => c.key === key)) return;
    setCategories([...categories, { key, label }]);
    setNewCatKey('');
    setNewCatLabel('');
  }

  function removeCategory(key: string) {
    setCategories(categories.filter((c) => c.key !== key));
  }

  function updateCategoryLabel(key: string, label: string) {
    setCategories(categories.map((c) => c.key === key ? { ...c, label } : c));
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Contact Info */}
      <SettingCard
        title="Contact & social info"
        description="WhatsApp number, Instagram URL, email and location shown across the site."
        onSave={handleContactSave}
        isPending={contactPending}
        saved={contactSaved}
      >
        <Field
          label="WhatsApp number (with country code)"
          value={whatsapp}
          onChange={setWhatsapp}
          placeholder="977XXXXXXXXXX"
          mono
          hint="Used in wa.me/ links. Include country code, no + or spaces."
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

      {/* Delivery fees */}
      <SettingCard
        title="Delivery fees"
        description="Shown to customers at checkout. Used whenever a product doesn't have its own delivery fee override."
        onSave={handleDeliverySave}
        isPending={deliveryPending}
        saved={deliverySaved}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Kathmandu Valley (NPR)"
            value={valleyFee}
            onChange={setValleyFee}
            placeholder="0"
            mono
            hint="Flat fee for in-valley delivery areas. 0 = free delivery."
          />
          <Field
            label="Outside Valley (NPR)"
            value={nationwideFee}
            onChange={setNationwideFee}
            placeholder="0"
            mono
            hint="Flat fee for nationwide/outside-valley orders."
          />
        </div>
      </SettingCard>

      {/* Categories */}
      <SettingCard
        title="Product categories"
        description="Categories shown in the shop filter and product form. The key is used in URLs, the label is shown to customers."
        onSave={handleCatSave}
        isPending={catPending}
        saved={catSaved}
      >
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-2">
              <span className="w-24 shrink-0 font-mono text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-stone-500">
                {cat.key}
              </span>
              <input
                type="text"
                value={cat.label}
                onChange={(e) => updateCategoryLabel(cat.key, e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button
                type="button"
                onClick={() => removeCategory(cat.key)}
                className="shrink-0 p-2 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                title="Remove category"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium">Add new category</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatKey}
              onChange={(e) => setNewCatKey(e.target.value)}
              placeholder="key (e.g. seasonal)"
              className="w-32 font-mono border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <input
              type="text"
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              placeholder="Label (e.g. Seasonal)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={!newCatKey.trim() || !newCatLabel.trim()}
              className="shrink-0 px-3 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 text-sm rounded-xl transition-colors font-medium"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400">Key becomes the URL slug — lowercase, no spaces. Hit Save after making changes.</p>
        </div>
      </SettingCard>

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

      {/* Bank details */}
      <SettingCard
        title="Bank details"
        description="Shown on the order confirmation page alongside the payment QR code."
        onSave={handleBankSave}
        isPending={bankPending}
        saved={bankSaved}
      >
        <Field
          label="Bank name"
          value={bankName}
          onChange={setBankName}
          placeholder="e.g. NIMB (Nepal Investment Mega Bank)"
        />
        <Field
          label="Account holder name"
          value={accountName}
          onChange={setAccountName}
          placeholder="e.g. Ram Bahadur Shrestha"
        />
        <Field
          label="Account number"
          value={accountNo}
          onChange={setAccountNo}
          placeholder="e.g. 03805030270878"
          mono
        />
      </SettingCard>

      {/* Payment QR */}
      <SettingCard
        title="Payment QR code"
        description="Scan-to-pay QR shown on the order confirmation page for the 10% advance."
        onSave={handleQrSave}
        isPending={qrPending}
        saved={qrSaved}
      >
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
    </div>
  );
}
