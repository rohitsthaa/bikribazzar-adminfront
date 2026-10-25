'use client';

import { useState, useTransition } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { SettingCard, Field, TextAreaField } from '@/components/SettingCard';
import { saveContactInfo, saveCurrency, saveBranding, saveShopCopy, saveEmailCopy, sendEmailTemplateTest } from './actions';

export default function SettingsClient({
  initialPhone,
  initialInstagram,
  initialFacebook,
  initialYoutube,
  initialTiktok,
  initialPinterest,
  initialX,
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
  initialEmailOrderSubject,
  initialEmailOrderHeading,
  initialEmailOrderMessage,
  initialEmailOrderButton,
  initialEmailUpdateSubject,
  initialEmailUpdateHeading,
  initialEmailUpdateMessage,
  initialEmailUpdateButton,
  initialAdminEmail,
}: {
  initialPhone: string;
  initialInstagram: string;
  initialFacebook: string;
  initialYoutube: string;
  initialTiktok: string;
  initialPinterest: string;
  initialX: string;
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
  initialEmailOrderSubject: string;
  initialEmailOrderHeading: string;
  initialEmailOrderMessage: string;
  initialEmailOrderButton: string;
  initialEmailUpdateSubject: string;
  initialEmailUpdateHeading: string;
  initialEmailUpdateMessage: string;
  initialEmailUpdateButton: string;
  initialAdminEmail: string;
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
      await Promise.all([
        saveShopCopy({ shopTitle, shopSubtitle, deliveryNote, returnsNote }),
        saveCurrency(currency),
      ]);
      setShopCopySaved(true);
      setTimeout(() => setShopCopySaved(false), 2000);
    });
  }

  // Contact info — no Soul-Thread placeholders; each store sets its own.
  const [phone, setPhone] = useState(initialPhone);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [facebook, setFacebook] = useState(initialFacebook);
  const [youtube, setYoutube] = useState(initialYoutube);
  const [tiktok, setTiktok] = useState(initialTiktok);
  const [pinterest, setPinterest] = useState(initialPinterest);
  const [x, setX] = useState(initialX);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [location, setLocation] = useState(initialLocation);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactPending, startContactTransition] = useTransition();
  const [activeProfileTab, setActiveProfileTab] = useState("contact");

  // Store-owned wording for customer order emails. The HTML layout remains fixed.
  const [emailOrderSubject, setEmailOrderSubject] = useState(initialEmailOrderSubject);
  const [emailOrderHeading, setEmailOrderHeading] = useState(initialEmailOrderHeading);
  const [emailOrderMessage, setEmailOrderMessage] = useState(initialEmailOrderMessage);
  const [emailOrderButton, setEmailOrderButton] = useState(initialEmailOrderButton);
  const [emailUpdateSubject, setEmailUpdateSubject] = useState(initialEmailUpdateSubject);
  const [emailUpdateHeading, setEmailUpdateHeading] = useState(initialEmailUpdateHeading);
  const [emailUpdateMessage, setEmailUpdateMessage] = useState(initialEmailUpdateMessage);
  const [emailUpdateButton, setEmailUpdateButton] = useState(initialEmailUpdateButton);
  const [emailCopySaved, setEmailCopySaved] = useState(false);
  const [emailCopyPending, startEmailCopyTransition] = useTransition();
  const [testRecipient, setTestRecipient] = useState(initialAdminEmail);
  const [testEmailType, setTestEmailType] = useState<'confirmation' | 'update'>('confirmation');
  const [testEmailStatus, setTestEmailStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testEmailPending, startTestEmailTransition] = useTransition();
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const profileTabs = [
    { id: "contact", label: "Contact & socials" },
    { id: "shop", label: "Shop & policies" },
    { id: "branding", label: "Branding & SEO" },
    { id: "emails", label: "Email wording" },
  ] as const;

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

  const [currency, setCurrency] = useState(initialCurrency || 'NPR');

  function handleContactSave() {
    startContactTransition(async () => {
      await saveContactInfo({ phone, instagram, facebook, youtube, tiktok, pinterest, x, email: contactEmail, location });
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    });
  }

  function handleEmailCopySave() {
    startEmailCopyTransition(async () => {
      await saveEmailCopy({
        orderSubject: emailOrderSubject,
        orderHeading: emailOrderHeading,
        orderMessage: emailOrderMessage,
        orderButton: emailOrderButton,
        updateSubject: emailUpdateSubject,
        updateHeading: emailUpdateHeading,
        updateMessage: emailUpdateMessage,
        updateButton: emailUpdateButton,
      });
      setEmailCopySaved(true);
      setTimeout(() => setEmailCopySaved(false), 2000);
    });
  }

  function handleTestEmail() {
    startTestEmailTransition(async () => {
      setTestEmailStatus(null);
      const result = await sendEmailTemplateTest({
        to: testRecipient,
        type: testEmailType,
        copy: {
          email_order_subject: emailOrderSubject,
          email_order_heading: emailOrderHeading,
          email_order_message: emailOrderMessage,
          email_order_button: emailOrderButton,
          email_update_subject: emailUpdateSubject,
          email_update_heading: emailUpdateHeading,
          email_update_message: emailUpdateMessage,
          email_update_button: emailUpdateButton,
        },
      });
      setTestEmailStatus(result.ok
        ? { ok: true, message: 'Test email sent. Check your inbox.' }
        : { ok: false, message: result.error });
    });
  }

  const previewTokens: Record<string, string> = {
    storeName: 'Your store',
    customerName: 'Jamie Example',
    orderId: '1042',
    status: 'Your order has been confirmed',
  };
  const previewText = (value: string) => value.replace(/\{(storeName|customerName|orderId|status)\}/gi, (token) => {
    const key = token.slice(1, -1);
    return previewTokens[key.charAt(0).toLowerCase() + key.slice(1)] ?? token;
  });
  const isConfirmationPreview = testEmailType === 'confirmation';
  const previewSubject = previewText(isConfirmationPreview ? emailOrderSubject : emailUpdateSubject);
  const previewHeading = previewText(isConfirmationPreview ? emailOrderHeading : emailUpdateHeading);
  const previewMessage = previewText(isConfirmationPreview ? emailOrderMessage : emailUpdateMessage);
  const previewButton = previewText(isConfirmationPreview ? emailOrderButton : emailUpdateButton);

  return (
    <div className="grid max-w-5xl gap-6 md:grid-cols-[190px_minmax(0,1fr)]">
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Store profile settings"
        className="flex flex-col gap-1 self-start"
      >
        {profileTabs.map((tab) => (
          <button
            key={tab.id}
            id={`profile-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeProfileTab === tab.id}
            aria-controls={`profile-panel-${tab.id}`}
            onClick={() => setActiveProfileTab(tab.id)}
            className={`shrink-0 border-l-2 px-3 py-3 text-left text-sm font-medium transition-colors ${
              activeProfileTab === tab.id
                ? 'border-[#c96a3a] bg-[#c96a3a]/[0.06] text-stone-900'
                : 'border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-w-0">
      {/* Contact Info */}
      <section
        id="profile-panel-contact"
        role="tabpanel"
        aria-labelledby="profile-tab-contact"
        hidden={activeProfileTab !== "contact"}
      >
      <SettingCard
        title="Contact & social info"
        description="Contact details and social profiles shown in your storefront footer and About page. Leave a social link blank to hide it."
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
        <Field label="Facebook URL" value={facebook} onChange={setFacebook} placeholder="https://www.facebook.com/yourpage" />
        <Field label="YouTube URL" value={youtube} onChange={setYoutube} placeholder="https://www.youtube.com/@yourchannel" />
        <Field label="TikTok URL" value={tiktok} onChange={setTiktok} placeholder="https://www.tiktok.com/@yourhandle" />
        <Field label="Pinterest URL" value={pinterest} onChange={setPinterest} placeholder="https://www.pinterest.com/yourprofile" />
        <Field label="X URL" value={x} onChange={setX} placeholder="https://x.com/yourhandle" />
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
      </section>

      {/* Shop page & policies */}
      <section
        id="profile-panel-shop"
        role="tabpanel"
        aria-labelledby="profile-tab-shop"
        hidden={activeProfileTab !== "shop"}
      >
      <SettingCard
        title="Shop page & policies"
        description="Set shop and policy copy plus the currency used for your prices. Leave copy blank for neutral defaults."
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
        <Field
          label="Currency symbol"
          value={currency}
          onChange={setCurrency}
          placeholder="NPR"
          mono
          hint='e.g. NPR, $, €, £, ₹. Appears before prices across your store.'
        />
      </SettingCard>
      </section>

      {/* Branding & SEO */}
      <section
        id="profile-panel-branding"
        role="tabpanel"
        aria-labelledby="profile-tab-branding"
        hidden={activeProfileTab !== "branding"}
      >
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
      </section>

      {/* Customer email wording */}
      <section
        id="profile-panel-emails"
        role="tabpanel"
        aria-labelledby="profile-tab-emails"
        hidden={activeProfileTab !== "emails"}
      >
        <SettingCard
          title="Customer email wording"
          description="Edit the text in order confirmation and order update emails. The email layout and styling stay the same. Leave a field blank to use its default wording."
          onSave={handleEmailCopySave}
          isPending={emailCopyPending}
          saved={emailCopySaved}
        >
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-semibold text-gray-800">Order confirmation</h3>
            <p className="mt-1 text-xs text-gray-400">Sent after a customer places an order.</p>
          </div>
          <Field label="Email subject" value={emailOrderSubject} onChange={setEmailOrderSubject}
            placeholder="Order Confirmed — {storeName}"
            hint="Available placeholders: {storeName}, {orderId}." />
          <Field label="Heading" value={emailOrderHeading} onChange={setEmailOrderHeading}
            placeholder="Order confirmed"
            hint="Available placeholders: {storeName}, {customerName}, {orderId}." />
          <TextAreaField label="Message" value={emailOrderMessage} onChange={setEmailOrderMessage}
            placeholder="Hi {customerName}, thank you for your order!"
            hint="Available placeholders: {storeName}, {customerName}, {orderId}." />
          <Field label="Tracking button text" value={emailOrderButton} onChange={setEmailOrderButton}
            placeholder="Track your order" />

          <div className="border-b border-gray-100 pb-4 pt-3">
            <h3 className="text-sm font-semibold text-gray-800">Order status update</h3>
            <p className="mt-1 text-xs text-gray-400">Sent when you change an order’s status.</p>
          </div>
          <Field label="Email subject" value={emailUpdateSubject} onChange={setEmailUpdateSubject}
            placeholder="Order update — {storeName}"
            hint="Available placeholders: {storeName}, {orderId}." />
          <Field label="Heading" value={emailUpdateHeading} onChange={setEmailUpdateHeading}
            placeholder="An update on your order"
            hint="Available placeholders: {storeName}, {customerName}, {status}." />
          <TextAreaField label="Message" value={emailUpdateMessage} onChange={setEmailUpdateMessage}
            placeholder="Hi {customerName}, {status}."
            hint="Available placeholders: {storeName}, {customerName}, {status}. The status is filled in automatically." />
          <Field label="Tracking button text" value={emailUpdateButton} onChange={setEmailUpdateButton}
            placeholder="Track your order" />

          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Send a test email</h3>
              <p className="mt-1 text-xs text-gray-500">Sends a sample using the text currently in these fields, even if you haven’t saved it yet.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium" htmlFor="test-email-template">Template</label>
                <select
                  id="test-email-template"
                  value={testEmailType}
                  onChange={(e) => setTestEmailType(e.target.value as 'confirmation' | 'update')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <option value="confirmation">Order confirmation</option>
                  <option value="update">Order status update</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium" htmlFor="test-email-recipient">Send to</label>
                <input
                  id="test-email-recipient"
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmailPreview((visible) => !visible)}
                aria-expanded={showEmailPreview}
                aria-controls="customer-email-preview"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {showEmailPreview ? 'Hide preview' : 'Preview email'}
              </button>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testEmailPending || !testRecipient.trim()}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testEmailPending ? 'Sending…' : 'Send test email'}
              </button>
              {testEmailStatus && (
                <p role={testEmailStatus.ok ? 'status' : 'alert'} className={`text-xs ${testEmailStatus.ok ? 'text-green-700' : 'text-red-600'}`}>
                  {testEmailStatus.message}
                </p>
              )}
            </div>
            {showEmailPreview && (
              <div id="customer-email-preview" className="overflow-hidden rounded-xl border border-gray-200 bg-[#f6f3f0] p-4 sm:p-6">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Email preview</p>
                  <p className="mt-1 truncate text-sm font-medium text-gray-800" title={previewSubject}>
                    Subject: {previewSubject || 'No subject'}
                  </p>
                </div>
                <div className="mx-auto mt-4 max-w-[600px] overflow-hidden rounded-2xl border border-[#ece6e0] bg-white font-sans text-[#322a2c] shadow-sm">
                  <div className="border-b border-[#f0ebe6] px-6 py-5">
                    {logoUrl.trim()
                      ? <img src={logoUrl.trim()} alt="Store logo" className="block max-h-[52px] max-w-[190px] object-contain object-left" />
                      : <p className="text-lg font-bold tracking-tight">Your store</p>}
                    {tagline.trim() && <p className="mt-1 text-xs text-[#81777a]">{tagline}</p>}
                  </div>
                  <div className="px-6 py-7 sm:px-8">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${isConfirmationPreview ? 'bg-[#edf6f1] text-[#276548]' : 'bg-[#eef3f4] text-[#385d62]'}`}>
                      {isConfirmationPreview ? 'Order received' : 'Order update'}
                    </span>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">{previewHeading || 'Your heading'}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#6f6669]">{previewMessage || 'Your message will appear here.'}</p>
                    {isConfirmationPreview && (
                      <>
                        <div className="my-5 rounded-xl bg-[#faf8f6] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#81777a]">Order summary</p>
                          <p className="mt-1 text-sm font-semibold">Order #1042</p>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-[#eee9e4] py-3 text-sm">
                          <span><strong>Sample product</strong><br /><span className="text-xs text-[#81777a]">Qty 1</span></span>
                          <span className="shrink-0">NPR 1,200</span>
                        </div>
                        <div className="flex justify-between py-4 text-sm font-bold"><span>Total</span><span>NPR 1,200</span></div>
                      </>
                    )}
                    {testEmailType === 'update' && <div className="mb-5 rounded-xl bg-[#faf8f6] px-4 py-3 text-sm text-[#6f6669]">Order reference <strong className="text-[#322a2c">#1042</strong></div>}
                    {previewButton && <div className="pt-2 text-center"><span className="inline-block rounded-lg bg-[#322a2c] px-6 py-3.5 text-sm font-bold text-white">{previewButton}</span></div>}
                    <p className="mt-4 text-center text-xs leading-5 text-[#81777a]">{isConfirmationPreview ? 'Use the button above to view your order status and delivery updates.' : 'View the latest status and details for your order at any time.'}</p>
                  </div>
                  <div className="border-t border-[#f0ebe6] bg-[#faf8f6] px-6 py-5 text-center text-xs leading-5 text-[#81777a]">
                    <p className="font-bold text-[#51474a]">Your store</p>
                    {(contactEmail || location) && <p className="mt-1">{[contactEmail, location].filter(Boolean).join(' · ')}</p>}
                    <p className="mt-3 text-[11px] text-[#aaa1a0]">Thank you for shopping with us.</p>
                  </div>
                </div>
                <p className="px-1 pt-3 text-xs text-gray-500">Sample order details are shown. Your saved store logo, tagline and contact details appear here when configured.</p>
              </div>
            )}
          </div>
        </SettingCard>
      </section>

      </div>

      {/* Payment QR / bank transfer toggle */}

      {/* Payment gateways (self-serve merchant credentials) */}
    </div>
  );
}
