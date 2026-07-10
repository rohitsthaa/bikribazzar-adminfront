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
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
      alert('This category has subcategories — move or delete them first.');
      return;
    }
    if (!confirm('Delete this category? Products already tagged with it will keep the old value.')) return;
    const res = await deleteCategoryAction(id);
    if (res.error) { alert(res.error); return; }
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
          allCategories={categories}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  const topLevel = categories.filter(c => c.parentId === null);
  const childrenOf = (parentId: number) => categories.filter(c => c.parentId === parentId);

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
          {topLevel.map(category => (
            <div key={category.id} className="space-y-2">
              <CategoryRow category={category} onEdit={setEditing} onDelete={handleDelete} />
              {childrenOf(category.id).map(child => (
                <div key={child.id} className="ml-8">
                  <CategoryRow category={child} onEdit={setEditing} onDelete={handleDelete} isSubcategory />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ category, onEdit, onDelete, isSubcategory }: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  isSubcategory?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 ${isSubcategory ? 'border-stone-100/70' : 'border-stone-100'}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 text-sm truncate">
          {isSubcategory && <span className="text-stone-300 mr-1.5">↳</span>}
          {category.label}
        </p>
        <p className="text-xs text-stone-400 mt-0.5">key: {category.key}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onEdit(category)}
          className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
          Edit
        </button>
        <button onClick={() => onDelete(category.id)}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
