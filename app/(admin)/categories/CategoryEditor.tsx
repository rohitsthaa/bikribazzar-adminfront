'use client';
import { useState, useTransition } from 'react';
import type { Category } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';
import { createCategoryAction, updateCategoryAction } from './actions';

const inputCls = 'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

interface Props {
  category?: Category;
  allCategories: Category[];
  defaultSortOrder: number;
  onSave: (category: Category) => void;
  onCancel: () => void;
}

// Letters/numbers of any script, hyphen-joined — matches the API's key rule. The old
// version kept only a–z/0–9, so a Nepali name ("कुर्ता") produced an empty key and the
// form just said "required".
function categoryKey(s: string) {
  return s.trim().toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

export default function CategoryEditor({ category, allCategories, defaultSortOrder, onSave, onCancel }: Props) {
  const isNew = !category;
  const [label, setLabel] = useState(category?.label ?? '');
  const [key, setKey] = useState(category?.key ?? '');
  const [keyTouched, setKeyTouched] = useState(!isNew);
  const [parentId, setParentId] = useState<number | null>(category?.parentId ?? null);
  const [description, setDescription] = useState(category?.description ?? '');
  const [image, setImage] = useState(category?.image ?? '');
  const [hidden, setHidden] = useState(category?.hidden ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  // Only top-level categories can be a parent — the tree is capped at 2 levels.
  const parentOptions = allCategories.filter((c) => c.parentId === null && c.id !== category?.id);
  const hasChildren = !isNew && allCategories.some((c) => c.parentId === category!.id);
  const keyChanged = !isNew && key.trim() !== category!.key;

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!keyTouched) setKey(categoryKey(value));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parentChanged = !isNew && parentId !== category!.parentId;
    const data = {
      key: categoryKey(key) || key.trim(),
      label: label.trim(),
      // A new category, or one moved under a different parent, goes to the end of its group.
      sortOrder: isNew || parentChanged
        ? (parentId === null ? defaultSortOrder : allCategories.filter((c) => c.parentId === parentId).length)
        : category!.sortOrder,
      parentId,
      hidden,
      description,
      image,
    };
    start(async () => {
      const res = isNew ? await createCategoryAction(data) : await updateCategoryAction(category!.id, data);
      if (res.error) { setError(res.error); return; }
      if (res.category) onSave(res.category);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Name</label>
        <input value={label} onChange={(e) => handleLabelChange(e.target.value)} required placeholder="e.g. Kurtas" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">
          Link <span className="text-stone-400 font-normal">(auto-filled from the name)</span>
        </label>
        <div className="flex items-center rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-[#c96a3a]/30">
          <span className="pl-3.5 text-sm text-stone-400 whitespace-nowrap">/shop?category=</span>
          <input
            value={key}
            onChange={(e) => { setKey(e.target.value); setKeyTouched(true); }}
            onBlur={() => setKey((k) => categoryKey(k) || k)}
            required placeholder="kurtas"
            pattern="[\p{L}\p{M}\p{N}]+(-[\p{L}\p{M}\p{N}]+)*"
            title="Letters, numbers and single hyphens"
            className="flex-1 min-w-0 py-2.5 pr-3.5 text-sm font-mono text-stone-900 bg-transparent focus:outline-none"
          />
        </div>
        {keyChanged && (
          <p className="mt-1.5 text-xs text-amber-700">
            Changing this changes the category&apos;s shop link. Links already shared or indexed by Google
            (/shop?category={category!.key}) will show all products instead.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">
          Parent category <span className="text-stone-400 font-normal">(optional — makes this a subcategory)</span>
        </label>
        {hasChildren ? (
          <div className={`${inputCls} bg-stone-50 text-stone-400`}>None — this category has its own subcategories</div>
        ) : parentOptions.length > 0 ? (
          <select value={parentId ?? ''} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)} className={inputCls}>
            <option value="">None — top-level category</option>
            {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        ) : (
          <div className={`${inputCls} bg-stone-50 text-stone-400`}>None — no top-level categories to nest under yet</div>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">
          Description <span className="text-stone-400 font-normal">(optional — shown at the top of the category page, and to search engines)</span>
        </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500}
          placeholder="e.g. Handloom cotton kurtas, cut and stitched in Kathmandu." className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Banner image <span className="text-stone-400 font-normal">(optional)</span></label>
        <div className="max-w-[220px]">
          <ImageUploader value={image} onChange={setImage} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-stone-700 cursor-pointer">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)}
          className="mt-0.5 rounded border-stone-300 text-[#c96a3a] focus:ring-[#c96a3a]" />
        <span>
          Hide from the shop menu
          <span className="block text-xs text-stone-400">Its products stay on sale under &ldquo;All&rdquo; — e.g. for a seasonal category.</span>
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
        <button type="submit" disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] disabled:opacity-50 transition-colors">
          {isPending ? 'Saving…' : isNew ? 'Add category' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
