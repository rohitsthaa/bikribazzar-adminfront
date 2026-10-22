'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/api';
import CategoryEditor from './CategoryEditor';
import { deleteCategoryAction, reorderCategoriesAction, updateCategoryAction } from './actions';

const btn = 'text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40';

export default function CategoriesClient({
  initialCategories, uncategorised, canEdit,
}: { initialCategories: Category[]; uncategorised: number; canEdit: boolean }) {
  const [categories, setCategories] = useState(
    [...initialCategories].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
  );
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, start] = useTransition();

  function handleSave(category: Category) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      // Keep the counts we already have — create/update responses don't carry them.
      const merged = idx >= 0 ? { ...prev[idx], ...category } : { ...category, productCount: 0, liveProductCount: 0 };
      const next = idx >= 0 ? prev.map((c, i) => (i === idx ? merged : c)) : [...prev, merged];
      return next.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    });
    setEditing(null);
  }

  const topLevel = categories.filter((c) => c.parentId === null);
  const childrenOf = (parentId: number) => categories.filter((c) => c.parentId === parentId);
  const siblingsOf = (c: Category) => (c.parentId === null ? topLevel : childrenOf(c.parentId));

  // Arrows instead of typing sort numbers: swap with the neighbour, then renumber the whole
  // sibling group 0..n so ties (every category used to default to 0) can't come back.
  function move(c: Category, dir: -1 | 1) {
    const sibs = siblingsOf(c);
    const i = sibs.findIndex((s) => s.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= sibs.length) return;
    const reordered = [...sibs];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    const items = reordered.map((s, n) => ({ id: s.id, sortOrder: n }));
    const order = new Map(items.map((x) => [x.id, x.sortOrder]));
    const prev = categories;
    setCategories((cs) => cs.map((x) => (order.has(x.id) ? { ...x, sortOrder: order.get(x.id)! } : x))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
    start(async () => {
      const r = await reorderCategoriesAction(items);
      if (r.error) { setError(r.error); setCategories(prev); }
    });
  }

  function toggleHidden(c: Category) {
    start(async () => {
      setError('');
      const r = await updateCategoryAction(c.id, {
        key: c.key, label: c.label, sortOrder: c.sortOrder, parentId: c.parentId, hidden: !c.hidden,
      });
      if (r.error) setError(r.error);
      else if (r.category) handleSave(r.category);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    start(async () => {
      const r = await deleteCategoryAction(target.id);
      if (r.error) { setError(r.error); setDeleting(null); return; }
      setCategories((prev) => prev.filter((c) => c.id !== target.id));
      setDeleting(null);
      setNotice(r.uncategorised ? `Deleted “${target.label}”. ${r.uncategorised} product${r.uncategorised > 1 ? 's are' : ' is'} now uncategorized.` : `Deleted “${target.label}”.`);
    });
  }

  const nextSortOrder = topLevel.length;

  return (
    <div className="space-y-4">
      {uncategorised > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900 flex-1 min-w-60">
            <span className="font-medium">{uncategorised} product{uncategorised > 1 ? 's have' : ' has'} no category.</span>{' '}
            They only appear under &ldquo;All&rdquo; in your shop.
          </p>
          <Link href="/products?category=none" className="px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-medium hover:bg-amber-800">
            Assign categories →
          </Link>
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c96a3a] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#b85f33] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add category
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {notice && <p role="status" className="text-sm text-stone-700 bg-stone-100 rounded-lg px-3 py-2">{notice}</p>}

      {categories.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
          <p className="text-sm font-medium text-stone-700">No categories yet</p>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Categories become your shop&apos;s menu (e.g. &ldquo;Kurtas&rdquo;, &ldquo;Shawls&rdquo;, &ldquo;Accessories&rdquo;).
            Until you add one, the shop simply lists all products.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topLevel.map((category, i) => (
            <div key={category.id} className="space-y-2">
              <CategoryRow
                category={category} canEdit={canEdit} busy={busy}
                isFirst={i === 0} isLast={i === topLevel.length - 1}
                hasLiveChild={childrenOf(category.id).some((ch) => (ch.liveProductCount ?? 1) > 0)}
                onMove={move} onEdit={setEditing} onDelete={setDeleting} onToggleHidden={toggleHidden}
              />
              {childrenOf(category.id).map((child, k, arr) => (
                <div key={child.id} className="ml-8">
                  <CategoryRow
                    category={child} canEdit={canEdit} busy={busy} isSubcategory
                    isFirst={k === 0} isLast={k === arr.length - 1}
                    onMove={move} onEdit={setEditing} onDelete={setDeleting} onToggleHidden={toggleHidden}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal onClose={() => setEditing(null)}>
          <h2 className="text-lg font-semibold text-stone-900 mb-5">
            {editing === 'new' ? 'New category' : `Edit “${editing.label}”`}
          </h2>
          <CategoryEditor
            category={editing === 'new' ? undefined : editing}
            allCategories={categories}
            defaultSortOrder={nextSortOrder}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <h2 className="text-lg font-semibold text-stone-900">Delete “{deleting.label}”?</h2>
          <p className="text-sm text-stone-600 mt-2">
            {(deleting.productCount ?? 0) > 0
              ? `${deleting.productCount} product${deleting.productCount! > 1 ? 's' : ''} in it will become uncategorized. The products themselves aren't deleted.`
              : 'No products are in this category.'}
            {' '}Links to <span className="font-mono text-xs">/shop?category={deleting.key}</span> will show all products instead.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancel</button>
            <button onClick={confirmDelete} disabled={busy}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
              {busy ? 'Deleting…' : 'Delete category'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:p-8" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function CategoryRow({
  category, canEdit, busy, isSubcategory, isFirst, isLast, hasLiveChild,
  onMove, onEdit, onDelete, onToggleHidden,
}: {
  category: Category; canEdit: boolean; busy: boolean; isSubcategory?: boolean;
  isFirst: boolean; isLast: boolean; hasLiveChild?: boolean;
  onMove: (c: Category, dir: -1 | 1) => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggleHidden: (c: Category) => void;
}) {
  const total = category.productCount ?? null;
  const live = category.liveProductCount ?? null;
  const notInMenu = !category.hidden && live === 0 && !hasLiveChild;
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 ${category.hidden ? 'border-stone-200 opacity-70' : 'border-stone-100'}`}>
      {canEdit && (
        <div className="flex flex-col">
          <button type="button" aria-label={`Move ${category.label} up`} disabled={busy || isFirst} onClick={() => onMove(category, -1)}
            className="text-stone-400 hover:text-stone-800 disabled:opacity-20 leading-none px-1">▲</button>
          <button type="button" aria-label={`Move ${category.label} down`} disabled={busy || isLast} onClick={() => onMove(category, 1)}
            className="text-stone-400 hover:text-stone-800 disabled:opacity-20 leading-none px-1">▼</button>
        </div>
      )}
      {category.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/image?src=${encodeURIComponent(category.image)}`} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 text-sm truncate flex items-center gap-2">
          {isSubcategory && <span className="text-stone-300">↳</span>}
          {category.label}
          {category.hidden && <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[11px] font-medium">Hidden</span>}
          {notInMenu && (
            <span title="Shown in the shop menu once it has a live product" className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium">
              Not in menu — no live products
            </span>
          )}
        </p>
        <p className="text-xs text-stone-400 mt-0.5 truncate">
          <span className="font-mono">/shop?category={category.key}</span>
          {total !== null && (
            <>
              {' · '}
              <Link href={`/products?category=${encodeURIComponent(category.key)}`} className="text-stone-600 hover:text-[#c96a3a] hover:underline">
                {total} product{total === 1 ? '' : 's'}{live !== null && live !== total ? ` (${live} live)` : ''}
              </Link>
            </>
          )}
        </p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggleHidden(category)} disabled={busy}
            title={category.hidden ? 'Show in the shop menu' : 'Hide from the shop menu (products stay on sale)'}
            className={`${btn} border-stone-200 text-stone-600 hover:bg-stone-50`}>
            {category.hidden ? 'Show' : 'Hide'}
          </button>
          <button onClick={() => onEdit(category)} className={`${btn} border-stone-200 text-stone-600 hover:bg-stone-50`}>Edit</button>
          <button onClick={() => onDelete(category)} disabled={busy} className={`${btn} border-red-100 text-red-500 hover:bg-red-50`}>Delete</button>
        </div>
      )}
    </div>
  );
}
