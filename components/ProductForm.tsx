'use client';
import { useFormState } from 'react-dom';
import { useState } from 'react';
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

function Submit({ isNew }: { isNew: boolean }) {
  return (
    <SubmitButton
      label={isNew ? 'Create product' : 'Save changes'}
      className="relative overflow-hidden px-5 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
    />
  );
}

export default function ProductForm({ product, action, categories = DEFAULT_CATEGORIES, canSetPrice = true }: Props) {
  const [state, formAction] = useFormState(action, null);
  const [image, setImage] = useState(product?.image ?? '');
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.images ?? []);
  const [prepaymentType, setPrepaymentType] = useState<PrepaymentType>(
    (product?.prepaymentType as PrepaymentType) ?? 'none'
  );
  const [isDigital, setIsDigital] = useState(product?.isDigital ?? false);
  const [digitalAssetUrl, setDigitalAssetUrl] = useState(product?.digitalAssetUrl ?? '');
  type VariantRow = { id?: string; label: string; priceNpr: string; stockQty: string; sku: string };
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      priceNpr: v.priceNpr == null ? '' : String(v.priceNpr),
      stockQty: v.stockQty == null ? '' : String(v.stockQty),
      sku: v.sku ?? '',
    })),
  );
  function addVariant() { setVariants([...variants, { label: '', priceNpr: '', stockQty: '', sku: '' }]); }
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
        sortOrder: i,
      })),
  );
  const isNew = !product;

  return (
    <form action={formAction}>
      <input type="hidden" name="_isNew" value={isNew ? '1' : '0'} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Image panel */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Primary image</h2>
            <p className="text-xs text-gray-400 mb-3">Shown on product cards, emails, and SEO.</p>
            <ImageUploader value={image} onChange={setImage} />
            <input type="hidden" name="image" value={image} />
          </div>

          {/* Gallery images */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Gallery images</h2>
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
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-stone-300 hover:text-gray-600 transition-colors"
              >
                + Add image
              </button>
            </div>
          </div>

          {/* Availability + Sort */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Visibility</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
              <select
                name="available"
                defaultValue={product?.available === false ? 'false' : 'true'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              >
                <option value="true">● Available (visible in shop)</option>
                <option value="false">○ Hidden (not visible)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Sort order</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={product?.sortOrder ?? 0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Basic info</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                ID (URL slug) <span className="text-red-400">*</span>
              </label>
              <input
                name="id"
                defaultValue={product?.id}
                required
                readOnly={!isNew}
                placeholder="e.g. shelf-double"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 read-only:bg-gray-50 read-only:text-gray-400 font-mono"
              />
              {isNew && <p className="text-xs text-gray-400 mt-1">Lowercase, hyphens only. Cannot be changed later.</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                defaultValue={product?.name}
                required
                placeholder="Double-Tier Macramé Shelf"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                defaultValue={product?.description}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Pricing & details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                <select
                  name="category"
                  defaultValue={product?.category ?? 'shelf'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Price (NPR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                  <input
                    name="priceNpr"
                    type="number"
                    min={0}
                    defaultValue={product?.priceNpr ?? 0}
                    placeholder="0"
                    disabled={!canSetPrice}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {canSetPrice ? 'Set 0 for "price on request".' : 'Price is managed by the store owner.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Dimensions / details</label>
              <input
                name="details"
                defaultValue={product?.details ?? ''}
                placeholder="e.g. 45 × 70 cm · natural pine · 4mm cotton cord"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Tag</label>
              <input
                name="tag"
                defaultValue={product?.tag ?? ''}
                placeholder="e.g. Bestseller, New, Made to order"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <p className="text-xs text-gray-400 mt-1">Shown as a badge on the product card.</p>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Inventory</h2>
              <p className="text-xs text-gray-400 mt-0.5">Leave stock blank to allow unlimited orders.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Stock qty</label>
                <input
                  name="stockQty"
                  type="number"
                  min={0}
                  defaultValue={product?.stockQty ?? ''}
                  placeholder="Unlimited"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Reorder point</label>
                <input
                  name="reorderPoint"
                  type="number"
                  min={0}
                  defaultValue={product?.reorderPoint ?? 0}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <p className="text-xs text-gray-400 mt-1">Alert when stock ≤ this.</p>
              </div>
            </div>
          </div>

          {/* Prepayment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Advance payment</h2>
              <p className="text-xs text-gray-400 mt-0.5">Require a partial payment before production begins.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Type</label>
              <select
                name="prepaymentType"
                value={prepaymentType}
                onChange={(e) => setPrepaymentType(e.target.value as PrepaymentType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              >
                <option value="none">No advance required</option>
                <option value="percentage">Percentage of price</option>
                <option value="fixed">Fixed NPR amount</option>
              </select>
            </div>

            {prepaymentType !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
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
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {prepaymentType === 'percentage'
                    ? 'Customer will be shown this % of the product price as the advance amount.'
                    : 'Customer will be shown this fixed NPR amount as the advance payment.'}
                </p>
              </div>
            )}

            {/* Always send value=0 when type=none so the form still submits the field */}
            {prepaymentType === 'none' && (
              <input type="hidden" name="prepaymentValue" value="0" />
            )}
          </div>

          {/* Variants — optional. When present, each variant has its own stock
              (and optional price); product-level price/stock act as the default. */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <input type="hidden" name="variants" value={variantsPayload} />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-700">Variants</h2>
              <button type="button" onClick={addVariant} className="text-xs font-medium text-stone-600 hover:text-stone-900">
                + Add variant
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              e.g. sizes or colors. Leave empty for a single-option product. Blank price = use product price; blank stock = unlimited.
            </p>

            {variants.length === 0 ? (
              <p className="text-xs text-gray-300">No variants. This product is sold as one option.</p>
            ) : (
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-[1fr_90px_80px_90px_28px] gap-2 text-[11px] uppercase tracking-wide text-gray-400 px-1">
                  <span>Label</span><span>Price</span><span>Stock</span><span>SKU</span><span />
                </div>
                {variants.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-2 sm:grid-cols-[1fr_90px_80px_90px_28px] gap-2">
                    <input
                      value={v.label}
                      onChange={(e) => updateVariant(idx, { label: e.target.value })}
                      placeholder="e.g. Red / L"
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
                    />
                    <input
                      value={v.priceNpr}
                      onChange={(e) => updateVariant(idx, { priceNpr: e.target.value })}
                      placeholder="price"
                      inputMode="numeric"
                      disabled={!canSetPrice}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100"
                    />
                    <input
                      value={v.stockQty}
                      onChange={(e) => updateVariant(idx, { stockQty: e.target.value })}
                      placeholder="stock"
                      inputMode="numeric"
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
                    />
                    <input
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                      placeholder="SKU"
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      title="Remove variant"
                      className="text-gray-300 hover:text-red-500 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Digital product */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Digital product</h2>
              <p className="text-xs text-gray-400 mt-0.5">Enable if this product is a downloadable file — no physical shipping required.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDigital"
                name="isDigital"
                value="true"
                checked={isDigital}
                onChange={(e) => setIsDigital(e.target.checked)}
                className="w-4 h-4 accent-stone-700"
              />
              <label htmlFor="isDigital" className="text-sm text-gray-700">Digital product (no physical shipping)</label>
            </div>
            {!isDigital && <input type="hidden" name="isDigital" value="false" />}
            {isDigital && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Download URL</label>
                <input
                  type="url"
                  name="digitalAssetUrl"
                  value={digitalAssetUrl}
                  onChange={(e) => setDigitalAssetUrl(e.target.value)}
                  placeholder="https://example.com/file.pdf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <p className="text-xs text-gray-400 mt-1">The file URL sent to the customer after delivery is confirmed.</p>
              </div>
            )}
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}

          <div className="flex gap-3">
            <Submit isNew={isNew} />
            <a href="/products" className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Cancel
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
