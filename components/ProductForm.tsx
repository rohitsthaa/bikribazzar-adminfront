'use client';
import { useRef, useState, useActionState } from 'react';
import type { Product } from '@/lib/api';
import ImageUploader from './ImageUploader';
import SubmitButton from './SubmitButton';

type PrepaymentType = 'none' | 'percentage' | 'fixed';

type Category = { key: string; label: string };

const DEFAULT_CATEGORIES: Category[] = [
  { key: 'shelf',  label: 'Hanging Shelves' },
  { key: 'hanger', label: 'Plant Hangers' },
  { key: 'wall',   label: 'Wall Hangings' },
  { key: 'custom', label: 'Custom Orders' },
];

type Props = {
  product?: Product;
  action: (state: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
  categories?: Category[];
  canSetPrice?: boolean; // staff can't set/change price
};

// Shared class for numeric inputs — hides the native up/down spinner so a
// short field (e.g. a 3-column dimension row) never clips its own text, and
// so every number field in the form looks the same rather than some having
// spinner arrows and others not.
const numInput =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
const textInput =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/50';
const fieldLabel = 'block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

// 16px line icons, same visual language as components/Sidebar.tsx's `Icons`.
function TabIcon({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const TAB_ICONS = {
  details:  'M4 4h16v16H4zM4 9h16M9 4v16',
  pricing:  'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  variants: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
};

type TabKey = 'details' | 'pricing' | 'variants' | 'settings';

// Reusable collapsible section header — for the optional/secondary blocks
// (Physical details, Advance payment, SEO) so they don't clutter product
// types that don't need them (e.g. dimensions don't apply to apparel).
function SectionToggle({
  title, subtitle, open, onToggle,
}: { title: string; subtitle: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between text-left">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  );
}

// A card section header with a small colored icon chip — the "designed"
// touch the rest of the admin already uses (Sidebar, InventoryPanel) that
// this form was missing.
function SectionHeading({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[#c96a3a]/10 text-[#c96a3a] flex items-center justify-center">
        <TabIcon d={icon} />
      </span>
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// Compact 40×40 thumbnail uploader for a single variant row — e.g. a photo of
// that color. Full-size ImageUploader (with its drop zone + URL field) is too
// tall to fit inline in the variant table, so this reuses the same /api/upload
// endpoint with a much smaller control.
function VariantImageCell({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok) onChange(json.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative w-10 h-10 shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={value ? 'Replace variant photo' : 'Add variant photo'}
        className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center hover:border-[#c96a3a]/50 transition-colors"
      >
        {uploading ? (
          <svg className="w-4 h-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/image?src=${encodeURIComponent(value)}`} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Remove photo"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-gray-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-[10px] leading-none"
        >
          ×
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function Submit({ isNew }: { isNew: boolean }) {
  return (
    <SubmitButton
      label={isNew ? 'Create product' : 'Save changes'}
      className="relative overflow-hidden px-5 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
    />
  );
}

export default function ProductForm({ product, action, categories = DEFAULT_CATEGORIES, canSetPrice = true }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [image, setImage] = useState(product?.image ?? '');
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.images ?? []);
  const [seoOpen, setSeoOpen] = useState(!!(product?.metaTitle || product?.metaDescription));
  const [physicalOpen, setPhysicalOpen] = useState(
    !!(product?.widthCm || product?.heightCm || product?.depthCm || product?.details)
  );
  const [prepaymentType, setPrepaymentType] = useState<PrepaymentType>(
    (product?.prepaymentType as PrepaymentType) ?? 'none'
  );
  const [advanceOpen, setAdvanceOpen] = useState(prepaymentType !== 'none');
  const [isDigital, setIsDigital] = useState(product?.isDigital ?? false);
  const [digitalAssetUrl, setDigitalAssetUrl] = useState(product?.digitalAssetUrl ?? '');
  type VariantRow = { id?: string; label: string; priceNpr: string; stockQty: string; sku: string; image: string };
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      priceNpr: v.priceNpr == null ? '' : String(v.priceNpr),
      stockQty: v.stockQty == null ? '' : String(v.stockQty),
      sku: v.sku ?? '',
      image: v.image ?? '',
    })),
  );
  function addVariant() { setVariants([...variants, { label: '', priceNpr: '', stockQty: '', sku: '', image: '' }]); }
  function removeVariant(idx: number) { setVariants(variants.filter((_, i) => i !== idx)); }
  function updateVariant(idx: number, patch: Partial<VariantRow>) {
    setVariants(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  // Serialized for the form action: empty price/stock → null (inherit / unlimited).
  const variantsPayload = JSON.stringify(
    variants
      .filter((v) => v.label.trim())
      .map((v, i) => ({
        id: v.id,
        label: v.label.trim(),
        priceNpr: v.priceNpr.trim() === '' ? null : Number(v.priceNpr),
        stockQty: v.stockQty.trim() === '' ? null : Number(v.stockQty),
        sku: v.sku.trim() || null,
        image: v.image.trim() || null,
        sortOrder: i,
      })),
  );
  const isNew = !product;
  // Extracted so the read-only/editable Stock qty branches below don't each
  // re-narrow `product` through the `isNew` alias — TS treats that as two
  // independent (and, in one arm, contradictory) narrowings of `product`.
  const currentStockQty = product?.stockQty;

  const [tab, setTab] = useState<TabKey>('details');
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'details',  label: 'Details',        icon: TAB_ICONS.details },
    { key: 'pricing',  label: 'Pricing & stock', icon: TAB_ICONS.pricing },
    { key: 'variants', label: `Variants${variants.length ? ` (${variants.length})` : ''}`, icon: TAB_ICONS.variants },
    { key: 'settings', label: 'Settings',        icon: TAB_ICONS.settings },
  ];
  // Panels use `hidden` (display:none) rather than unmounting on tab switch —
  // every field must stay in the DOM so its value is still included in the
  // single native form submission on Save, regardless of which tab is active.
  const panel = (key: TabKey) => (tab === key ? '' : 'hidden');

  return (
    <form action={formAction} className="pb-24">
      <input type="hidden" name="_isNew" value={isNew ? '1' : '0'} />
      {/* Snapshot of the images this product had before this edit — actions.ts
          diffs these against the saved values to clean up now-orphaned
          uploaded files (e.g. after a "Replace photo" or "Remove"). Only
          meaningful on edit; harmless empty arrays on create. */}
      <input type="hidden" name="_prevImage" value={product?.image ?? ''} />
      <input type="hidden" name="_prevImages" value={JSON.stringify(product?.images ?? [])} />
      <input
        type="hidden"
        name="_prevVariantImages"
        value={JSON.stringify((product?.variants ?? []).map((v) => v.image).filter(Boolean))}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: persistent media + visibility rail — stays visible across every tab */}
        <div className="lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-gray-900">Primary image</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">Shown on product cards, emails, and SEO.</p>
            <ImageUploader value={image} onChange={setImage} />
            <input type="hidden" name="image" value={image} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-0.5">Gallery images</h2>
            <p className="text-xs text-gray-400 mb-4">Extra angles shown in the product detail carousel.</p>
            <input type="hidden" name="images" value={JSON.stringify(galleryImages)} />
            <div className="space-y-3">
              {galleryImages.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <ImageUploader
                      value={url}
                      onChange={(newUrl) => {
                        const next = [...galleryImages];
                        next[i] = newUrl;
                        setGalleryImages(next);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setGalleryImages(galleryImages.filter((_, j) => j !== i))}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setGalleryImages([...galleryImages, ''])}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-[#c96a3a]/40 hover:text-[#c96a3a] transition-colors"
              >
                + Add image
              </button>
            </div>
          </div>

          {/* The one toggle that actually controls the shop — kept isolated and
              visible on every tab so it's never confused with the (tab-buried)
              Catalog stage / Sort order, which are purely internal. */}
          <div className="bg-white rounded-2xl border-2 border-[#c96a3a]/20 bg-[#c96a3a]/[0.03] shadow-sm p-5 space-y-2">
            <h2 className="text-[15px] font-semibold text-gray-900">Visibility</h2>
            <select
              name="available"
              defaultValue={product?.available === false ? 'false' : 'true'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 bg-white"
            >
              <option value="true">● Available (visible in shop)</option>
              <option value="false">○ Hidden (not visible)</option>
            </select>
            <p className="text-xs text-gray-400">This is what controls whether customers can see it.</p>
          </div>
        </div>

        {/* Right: tabbed content */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-5 bg-stone-100 rounded-xl p-1 w-fit overflow-x-auto max-w-full">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                  tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <span className={tab === t.key ? 'text-[#c96a3a]' : 'text-stone-400'}>
                  <TabIcon d={t.icon} />
                </span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* ── Details tab ─────────────────────────────────────────────── */}
            <div className={panel('details')}>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionHeading icon={TAB_ICONS.details} title="Basic info" />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>ID (URL slug) <span className="text-red-400">*</span></label>
                        <input
                          name="id"
                          defaultValue={product?.id}
                          required
                          readOnly={!isNew}
                          placeholder="e.g. product-name"
                          className={`${textInput} read-only:bg-gray-50 read-only:text-gray-400 font-mono`}
                        />
                        {isNew && <p className="text-xs text-gray-400 mt-1">Lowercase, hyphens only. Can&apos;t change later.</p>}
                      </div>
                      <div>
                        <label className={fieldLabel}>SKU</label>
                        <input
                          name="sku"
                          defaultValue={product?.sku ?? ''}
                          placeholder="Optional"
                          className={`${textInput} font-mono`}
                        />
                        <p className="text-xs text-gray-400 mt-1">Blank if using per-variant SKUs.</p>
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabel}>Name <span className="text-red-400">*</span></label>
                      <input
                        name="name"
                        defaultValue={product?.name}
                        required
                        placeholder="Product name"
                        className={`${textInput} text-base py-2.5`}
                      />
                    </div>

                    <div>
                      <label className={fieldLabel}>Description <span className="text-red-400">*</span></label>
                      <textarea
                        name="description"
                        defaultValue={product?.description}
                        required
                        rows={4}
                        placeholder="A short, customer-facing description."
                        className={`${textInput} resize-none`}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionHeading icon="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" title="Tags & badge" />

                  <div className="space-y-4">
                    <div>
                      <label className={fieldLabel}>Badge</label>
                      <input
                        name="tag"
                        defaultValue={product?.tag ?? ''}
                        placeholder="e.g. Bestseller, New, Made to order"
                        className={textInput}
                      />
                      <p className="text-xs text-gray-400 mt-1">A single label shown on the product card and detail page.</p>
                    </div>

                    <div>
                      <label className={fieldLabel}>Filter tags</label>
                      <input
                        name="tags"
                        defaultValue={(product?.tags ?? []).join(', ')}
                        placeholder="e.g. gift, wedding, bestseller"
                        className={textInput}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Comma-separated. Lets customers filter the shop by these — different from the single Badge above.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionToggle
                    title="Physical details"
                    subtitle={physicalOpen ? 'Dimensions and materials/notes.' : 'Optional — not every product needs this (e.g. apparel).'}
                    open={physicalOpen}
                    onToggle={() => setPhysicalOpen(!physicalOpen)}
                  />

                  {physicalOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={fieldLabel}>Dimensions (cm)</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Width</span>
                            <input name="widthCm" type="number" min={0} step="0.1" defaultValue={product?.widthCm ?? ''} placeholder="0" className={numInput} />
                          </div>
                          <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Height</span>
                            <input name="heightCm" type="number" min={0} step="0.1" defaultValue={product?.heightCm ?? ''} placeholder="0" className={numInput} />
                          </div>
                          <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Depth</span>
                            <input name="depthCm" type="number" min={0} step="0.1" defaultValue={product?.depthCm ?? ''} placeholder="0" className={numInput} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Shown to customers on the product page. Leave blank if not applicable.</p>
                      </div>

                      <div>
                        <label className={fieldLabel}>Details (materials, notes)</label>
                        <input
                          name="details"
                          defaultValue={product?.details ?? ''}
                          placeholder="Optional notes — materials, care instructions, etc."
                          className={textInput}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Pricing & stock tab ──────────────────────────────────────── */}
            <div className={panel('pricing')}>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionHeading icon={TAB_ICONS.pricing} title="Pricing" />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Category</label>
                        <select
                          name="category"
                          defaultValue={product?.category ?? categories[0]?.key}
                          className={`${textInput} bg-white`}
                        >
                          {categories.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={fieldLabel}>Price (NPR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                          <input
                            name="priceNpr"
                            type="number"
                            min={0}
                            defaultValue={product?.priceNpr ?? 0}
                            placeholder="0"
                            disabled={!canSetPrice}
                            className={`${numInput} pl-10 text-base font-semibold disabled:bg-gray-100 disabled:text-gray-400`}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {canSetPrice ? 'Set 0 for "price on request".' : 'Managed by the store owner.'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabel}>Sale price (NPR)</label>
                      <div className="relative max-w-[200px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                        <input
                          name="compareAtPriceNpr"
                          type="number"
                          min={0}
                          defaultValue={product?.compareAtPriceNpr ?? ''}
                          placeholder="None"
                          disabled={!canSetPrice}
                          className={`${numInput} pl-10 disabled:bg-gray-100 disabled:text-gray-400`}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {canSetPrice
                          ? 'Optional "original" price shown struck through, e.g. for a seasonal promo. Must be higher than the price above to show.'
                          : 'Managed by the store owner.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionHeading
                    icon="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"
                    title="Inventory"
                    subtitle={isNew ? 'Leave stock blank to allow unlimited orders.' : 'Stock is set once here, then tracked as batches — see the Inventory panel.'}
                  />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Stock qty</label>
                        {isNew ? (
                          <input name="stockQty" type="number" min={0} defaultValue={currentStockQty ?? ''} placeholder="Unlimited" className={numInput} />
                        ) : (
                          <>
                            {/* Deliberately not a form field on edit: every save used to
                                resubmit whatever number was on screen when the page
                                loaded, silently clobbering any restock/adjustment made
                                in the Inventory panel (or by a sale) in the meantime.
                                Read-only here; the Inventory panel is the only place
                                this number actually changes, so it can't go stale. */}
                            <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                              {currentStockQty == null ? 'Unlimited' : `${currentStockQty} in stock`}
                            </div>
                            <a href="#inventory-panel" className="text-xs text-[#c96a3a] hover:underline mt-1 inline-block">
                              Manage stock in the Inventory panel →
                            </a>
                          </>
                        )}
                      </div>
                      <div>
                        <label className={fieldLabel}>Reorder point</label>
                        <input name="reorderPoint" type="number" min={0} defaultValue={product?.reorderPoint ?? 0} placeholder="0" className={numInput} />
                        <p className="text-xs text-gray-400 mt-1">Alert when stock ≤ this.</p>
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabel}>Lead time (days)</label>
                      <input name="leadTimeDays" type="number" min={0} defaultValue={product?.leadTimeDays ?? ''} placeholder="Not applicable" className={`${numInput} max-w-[160px]`} />
                      <p className="text-xs text-gray-400 mt-1">
                        For handmade/made-to-order pieces. Shown to customers when out of stock.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionHeading
                    icon="M3 3h18v18H3zM3 9h18M9 21V9"
                    title="Delivery fee override"
                    subtitle="Leave blank to use the store's default delivery fee (set in Settings)."
                  />
                  <div className="max-w-[200px]">
                    <label className={fieldLabel}>Fee for this product (NPR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                      <input
                        name="deliveryFeeNpr"
                        type="number"
                        min={0}
                        defaultValue={product?.deliveryFeeNpr ?? ''}
                        placeholder="Store default"
                        className={`${numInput} pl-10`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Enter 0 for free delivery on this product, or a flat amount for bulkier pieces that cost more to ship.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Variants tab ─────────────────────────────────────────────── */}
            <div className={panel('variants')}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <input type="hidden" name="variants" value={variantsPayload} />
                <div className="flex items-center justify-between mb-1">
                  <SectionHeading icon={TAB_ICONS.variants} title="Variants" subtitle="e.g. sizes or colors — leave empty for a single-option product." />
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs font-medium text-white bg-stone-800 hover:bg-stone-700 rounded-lg px-3 py-1.5 transition-colors shrink-0"
                  >
                    + Add variant
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                    <p className="text-sm text-gray-400">No variants — this product is sold as one option.</p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-3">
                    <div className="hidden sm:grid grid-cols-[40px_1fr_90px_80px_90px_28px] gap-2 text-[11px] uppercase tracking-wide text-gray-400 px-1">
                      <span /><span>Label</span><span>Price</span><span>Stock</span><span>SKU</span><span />
                    </div>
                    {variants.map((v, idx) => (
                      <div key={idx} className="grid grid-cols-2 sm:grid-cols-[40px_1fr_90px_80px_90px_28px] gap-2 sm:items-center p-2 rounded-lg hover:bg-stone-50 transition-colors">
                        <VariantImageCell value={v.image} onChange={(url) => updateVariant(idx, { image: url })} />
                        <input
                          value={v.label}
                          onChange={(e) => updateVariant(idx, { label: e.target.value })}
                          placeholder="e.g. Red / L"
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                        />
                        <input
                          value={v.priceNpr}
                          onChange={(e) => updateVariant(idx, { priceNpr: e.target.value })}
                          placeholder="price"
                          inputMode="numeric"
                          disabled={!canSetPrice}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                        />
                        <input
                          value={v.stockQty}
                          onChange={(e) => updateVariant(idx, { stockQty: e.target.value })}
                          placeholder="stock"
                          inputMode="numeric"
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                        />
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                          placeholder="SKU"
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          title="Remove variant"
                          className="text-gray-300 hover:text-red-500 text-lg leading-none justify-self-end sm:justify-self-auto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">Blank price = use the product price. Blank stock = unlimited.</p>
              </div>
            </div>

            {/* ── Settings tab ─────────────────────────────────────────────── */}
            <div className={panel('settings')}>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionHeading icon={TAB_ICONS.settings} title="Organize" subtitle="For your own tracking — doesn't affect the shop." />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabel}>Catalog stage</label>
                      <select
                        name="status"
                        defaultValue={product?.status ?? 'active'}
                        className={`${textInput} bg-white`}
                      >
                        <option value="draft">Draft — still being set up</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived — discontinued</option>
                      </select>
                    </div>
                    <div>
                      <label className={fieldLabel}>Sort order</label>
                      <input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} className={numInput} />
                      <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionToggle
                    title="Advance payment"
                    subtitle={advanceOpen ? 'Require a partial payment before production begins.' : 'Optional — for made-to-order or custom pieces.'}
                    open={advanceOpen}
                    onToggle={() => setAdvanceOpen(!advanceOpen)}
                  />

                  {advanceOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={fieldLabel}>Type</label>
                        <select
                          name="prepaymentType"
                          value={prepaymentType}
                          onChange={(e) => setPrepaymentType(e.target.value as PrepaymentType)}
                          className={`${textInput} bg-white`}
                        >
                          <option value="none">No advance required</option>
                          <option value="percentage">Percentage of price</option>
                          <option value="fixed">Fixed NPR amount</option>
                        </select>
                      </div>

                      {prepaymentType !== 'none' && (
                        <div>
                          <label className={fieldLabel}>
                            {prepaymentType === 'percentage' ? 'Percentage (%)' : 'Amount (NPR)'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                              {prepaymentType === 'percentage' ? '%' : 'NPR'}
                            </span>
                            <input
                              name="prepaymentValue"
                              type="number"
                              min={0}
                              max={prepaymentType === 'percentage' ? 100 : undefined}
                              defaultValue={product?.prepaymentValue ?? (prepaymentType === 'percentage' ? 10 : 0)}
                              className={`${numInput} pl-10`}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {prepaymentType === 'percentage'
                              ? 'Customer will be shown this % of the product price as the advance amount.'
                              : 'Customer will be shown this fixed NPR amount as the advance payment.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {prepaymentType === 'none' && (
                    <input type="hidden" name="prepaymentValue" value="0" />
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Digital product</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Enable if this is a downloadable file — no physical shipping.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDigital"
                      name="isDigital"
                      value="true"
                      checked={isDigital}
                      onChange={(e) => setIsDigital(e.target.checked)}
                      className="w-4 h-4 accent-[#c96a3a]"
                    />
                    <label htmlFor="isDigital" className="text-sm text-gray-700">Digital product (no physical shipping)</label>
                  </div>
                  {!isDigital && <input type="hidden" name="isDigital" value="false" />}
                  {isDigital && (
                    <div>
                      <label className={fieldLabel}>Download URL</label>
                      <input
                        type="url"
                        name="digitalAssetUrl"
                        value={digitalAssetUrl}
                        onChange={(e) => setDigitalAssetUrl(e.target.value)}
                        placeholder="https://example.com/file.pdf"
                        className={textInput}
                      />
                      <p className="text-xs text-gray-400 mt-1">Sent to the customer after delivery is confirmed.</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <SectionToggle
                    title="SEO"
                    subtitle={seoOpen ? 'Custom title and description for search engines.' : 'Optional — override the auto-generated search preview.'}
                    open={seoOpen}
                    onToggle={() => setSeoOpen(!seoOpen)}
                  />

                  {seoOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={fieldLabel}>
                          Meta title <span className="normal-case font-normal text-gray-400">(max 120 chars)</span>
                        </label>
                        <input
                          name="metaTitle"
                          defaultValue={product?.metaTitle ?? ''}
                          maxLength={120}
                          placeholder="Leave blank to auto-generate from the product name"
                          className={textInput}
                        />
                        <p className="text-xs text-gray-400 mt-1">Shown as the clickable headline in Google results. ~50–60 chars is ideal.</p>
                      </div>

                      <div>
                        <label className={fieldLabel}>
                          Meta description <span className="normal-case font-normal text-gray-400">(max 320 chars)</span>
                        </label>
                        <textarea
                          name="metaDescription"
                          defaultValue={product?.metaDescription ?? ''}
                          maxLength={320}
                          rows={3}
                          placeholder="Leave blank to auto-generate from the product description"
                          className={`${textInput} resize-none`}
                        />
                        <p className="text-xs text-gray-400 mt-1">Shown below the title in Google results. ~150–160 chars is ideal.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 lg:ml-[19.5rem]">
          {state.error}
        </p>
      )}

      {/* Sticky save bar — reachable from any tab without scrolling to the
          bottom of a long form. Scoped to this component's own width (not a
          full-bleed hack) since ProductForm can be nested next to sibling
          columns, e.g. the InventoryPanel on the edit page. */}
      <div className="sticky bottom-0 mt-6 py-4 bg-white/95 backdrop-blur border-t border-gray-200 flex gap-3 z-10">
        <Submit isNew={isNew} />
        <a href="/products" className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
