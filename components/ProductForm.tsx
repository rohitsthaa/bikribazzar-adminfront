'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import type { Product } from '@/lib/api';
import ImageUploader from './ImageUploader';

type Props = {
  product?: Product;
  action: (state: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
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

const CATEGORIES = ['shelf', 'hanger', 'wall', 'custom'] as const;

export default function ProductForm({ product, action }: Props) {
  const [state, formAction] = useFormState(action, null);
  const [image, setImage] = useState(product?.image ?? '');
  const isNew = !product;

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="_isNew" value={isNew ? '1' : '0'} />

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-medium text-gray-900">Basic info</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ID (URL slug) <span className="text-red-500">*</span>
            </label>
            <input
              name="id"
              defaultValue={product?.id}
              required
              readOnly={!isNew}
              placeholder="e.g. shelf-double"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 read-only:bg-gray-50 read-only:text-gray-500"
            />
            {isNew && <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, hyphens only. Cannot be changed later.</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              defaultValue={product?.name}
              required
              placeholder="Double-Tier Macramé Shelf"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              defaultValue={product?.description}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              name="category"
              defaultValue={product?.category ?? 'shelf'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (NPR)</label>
            <input
              name="priceNpr"
              type="number"
              min={0}
              defaultValue={product?.priceNpr ?? 0}
              placeholder="0 = price on request"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Details</label>
            <input
              name="details"
              defaultValue={product?.details ?? ''}
              placeholder="e.g. 45 × 70 cm · natural pine · 4mm cotton cord"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag</label>
            <input
              name="tag"
              defaultValue={product?.tag ?? ''}
              placeholder="e.g. Bestseller, New, Made to order"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort order</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={product?.sortOrder ?? 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
            <ImageUploader value={image} onChange={setImage} />
            <input type="hidden" name="image" value={image} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
            <select
              name="available"
              defaultValue={product?.available === false ? 'false' : 'true'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            >
              <option value="true">Available (visible in shop)</option>
              <option value="false">Hidden (not visible in shop)</option>
            </select>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Submit isNew={isNew} />
        <a href="/products" className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
