'use client';
import { useState, useTransition } from 'react';
import type { Category } from '@/lib/api';
import { createCategoryAction, updateCategoryAction } from './actions';

const inputCls = 'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

interface Props {
  category?: Category;
  allCategories: Category[];
  onSave: (category: Category) => void;
  onCancel: () => void;
}

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CategoryEditor({ category, allCategories, onSave, onCancel }: Props) {
  const isNew = !category;
  const [label, setLabel] = useState(category?.label ?? '');
  const [key, setKey] = useState(category?.key ?? '');
  const [keyTouched, setKeyTouched] = useState(!isNew);
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0);
  const [parentId, setParentId] = useState<number | null>(category?.parentId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  // Only top-level categories can be a parent — the tree is capped at 2 levels.
  // Exclude the category being edited itself (can't be its own parent).
  const parentOptions = allCategories.filter((c) => c.parentId === null && c.id !== category?.id);
  const hasChildren = !isNew && allCategories.some((c) => c.parentId === category!.id);

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!keyTouched) setKey(slugify(value));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = { key: key.trim(), label: label.trim(), sortOrder, parentId };
    start(async () => {
      const res = isNew
        ? await createCategoryAction(data)
        : await updateCategoryAction(category!.id, data);
      if (res.error) { setError(res.error); return; }
      if (res.category) onSave(res.category);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Label</label>
        <input value={label} onChange={e => handleLabelChange(e.target.value)} required placeholder="e.g. Dresses" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Key <span className="text-stone-400 font-normal">(used internally to tag products — must be unique)</span></label>
        <input value={key} onChange={e => { setKey(e.target.value); setKeyTouched(true); }} required placeholder="e.g. dresses" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">
          Parent category <span className="text-stone-400 font-normal">(optional — makes this a subcategory)</span>
        </label>
        {hasChildren ? (
          <div className={`${inputCls} bg-stone-50 text-stone-400`}>
            None — this category has its own subcategories
          </div>
        ) : parentOptions.length > 0 ? (
          <select
            value={parentId ?? ''}
            onChange={e => setParentId(e.target.value ? Number(e.target.value) : null)}
            className={inputCls}
          >
            <option value="">None — top-level category</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        ) : (
          <div className={`${inputCls} bg-stone-50 text-stone-400`}>
            None — no top-level categories to nest under yet
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Sort order</label>
        <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className={inputCls} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
