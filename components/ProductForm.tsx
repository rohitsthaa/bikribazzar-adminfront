'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import type { Product } from '@/lib/api';
import ImageUploader from './ImageUploader';

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
};

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors font-medium"
    >
      {pending ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
    </button>
  );
}

export default function ProductForm({ product, action, categories = DEFAULT_CATEGORIES }: Props) {
  const [state, formAction] = useFormState(action, null);
  const [image, setImage] = useState(product?.image ?? '');
  const [prepaymentType, setPrepaymentType] = useState<PrepaymentType>(
    (product?.prepaymentType as PrepaymentType) ?? 'none'
  );
  const isNew = !product;

  return (
    <form action={formAction}>
      <input type="hidden" name="_isNew" value={isNew ? '1' : '0'} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Image panel */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Product image</h2>
            <ImageUploader value={image} onChange={setImage} />
            <input type="hidden" name="image" value={image} />
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
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Set 0 for "price on request".</p>
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
