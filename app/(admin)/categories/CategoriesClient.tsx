'use client';
import { useState } from 'react';
import type { Category } from '@/lib/api';
import CategoryEditor from './CategoryEditor';
import { deleteCategoryAction } from './actions';

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(
    [...initialCategories].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [editing, setEditing] = useState<Category | null | 'new'>(null);

  function handleSave(category: Category) {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === category.id);
      const next = idx >= 0
        ? [...prev.slice(0, idx), category, ...prev.slice(idx + 1)]
        : [...prev, category];
      return next.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category? Products already tagged with it will keep the old value.')) return;
    await deleteCategoryAction(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  if (editing !== null) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-6">
          {editing === 'new' ? 'New category' : `Edit — ${(editing as Category).label}`}
        </h2>
        <CategoryEditor
          category={editing === 'new' ? undefined : editing as Category}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c96a3a] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#b85f33] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-12 text-center">
          <p className="text-stone-400 text-sm">No categories yet. Add your first category above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 text-sm truncate">{category.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">key: {category.key}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing(category)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(category.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
