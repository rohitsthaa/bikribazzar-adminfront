'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import { SettingCard, Field } from '@/components/SettingCard';
import { saveAboutImage, saveContactInfo, saveCurrency, saveBranding, saveShopCopy } from './actions';

export default function SettingsClient({
  initialAboutImage,
  initialPhone,
  initialInstagram,
  initialContactEmail,
  initialLocation,
  initialCurrency,
  initialTagline,
  initialMetaDescription,
  initialLogoUrl,
  initialOgImage,
  initialShopTitle,
  initialShopSubtitle,
  initialDeliveryNote,
  initialReturnsNote,
}: {
  initialAboutImage: string;
  initialPhone: string;
  initialInstagram: string;
  initialContactEmail: string;
  initialLocation: string;
  initialCurrency: string;
  initialTagline: string;
  initialMetaDescription: string;
  initialLogoUrl: string;
  initialOgImage: string;
  initialShopTitle: string;
  initialShopSubtitle: string;
  initialDeliveryNote: string;
  initialReturnsNote: string;
}) {
  // Shop page & policies
  const [shopTitle, setShopTitle] = useState(initialShopTitle);
  const [shopSubtitle, setShopSubtitle] = useState(initialShopSubtitle);
  const [deliveryNote, setDeliveryNote] = useState(initialDeliveryNote);
  const [returnsNote, setReturnsNote] = useState(initialReturnsNote);
  const [shopCopySaved, setShopCopySaved] = useState(false);
  const [shopCopyPending, startShopCopyTransition] = useTransition();

  function handleShopCopySave() {
    startShopCopyTransition(async () => {
      await saveShopCopy({ shopTitle, shopSubtitle, deliveryNote, returnsNote });
      setShopCopySaved(true);
      setTimeout(() => setShopCopySaved(false), 2000);
    });
  }

  // About image
  const [aboutImage, setAboutImage] = useState(initialAboutImage);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutPending, startAboutTransition] = useTransition();

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
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [ogImage, setOgImage] = useState(initialOgImage);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingPending, startBrandingTransition] = useTransition();

  function handleBrandingSave() {
    startBrandingTransition(async () => {
      await saveBranding({ tagline, metaDescription, logoUrl, ogImage });
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

  function handleContactSave() {
    startContactTransition(async () => {
      await saveContactInfo(phone, instagram, contactEmail, location);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
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

      {/* Shop page & policies */}
      <SettingCard
        title="Shop page & policies"
        description="Wording your theme shows on the shop and product pages. Leave blank to use a neutral default — your theme won't make promises for you."
        onSave={handleShopCopySave}
        isPending={shopCopyPending}
        saved={shopCopySaved}
      >
        <Field label="Shop page heading" value={shopTitle} onChange={setShopTitle}
          placeholder="Your theme's default (e.g. “Shop”)" />
        <Field label="Shop page intro" value={shopSubtitle} onChange={setShopSubtitle}
          placeholder="e.g. Handloom cotton, cut and stitched in Kathmandu."
          hint="Blank shows the number of products." />
        <Field label="Delivery" value={deliveryNote} onChange={setDeliveryNote}
          placeholder="e.g. Kathmandu Valley in 2–3 days. Nationwide on request."
          hint="Shown on every product page. Blank: “Delivery time and charge are confirmed with you after you order.”" />
        <Field label="Returns" value={returnsNote} onChange={setReturnsNote}
          placeholder="e.g. 7-day returns on unworn items."
          hint="Shown by themes that have a returns box. Blank: “Ask us about returns and exchanges before you order.”" />
      </SettingCard>

      {/* Branding & SEO */}
      <SettingCard
        title="Branding & SEO"
        description="Your store's tagline, search/social description and logo. Shown in the browser tab, Google results, and social shares. Fonts are on the Design page."
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

      {/* Payment gateways (self-serve merchant credentials) */}
    </div>
  );
}
