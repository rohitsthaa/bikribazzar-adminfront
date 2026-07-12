'use client';

import { useMemo, useState, useTransition, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FinanceCategory, LedgerEntry } from '@/lib/api';
import { addEntry, removeEntry, addCategory, toggleCategory, removeCategory } from './actions';
import EmptyState from '@/components/EmptyState';

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-lg bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] transition-colors disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const ENTRY_INITIAL = { error: undefined } as { error?: string };
const CATEGORY_INITIAL = { error: undefined } as { error?: string };

type Props = {
  entries: LedgerEntry[];
  categories: FinanceCategory[];
  currency: string;
};

export default function TransactionsClient({ entries, categories, currency }: Props) {
  const [entryState, entryAction] = useActionState(addEntry, ENTRY_INITIAL);
  const [categoryState, categoryAction] = useActionState(addCategory, CATEGORY_INITIAL);
  const [, startTransition] = useTransition();
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showCategories, setShowCategories] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const activeCategories = categories.filter((c) => c.active && c.type === formType);

  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return entries;
    return entries.filter((e) => e.type === filterType);
  }, [entries, filterType]);

  return (
    <div className="space-y-8">
      {/* Add transaction form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-900">New transaction</h2>
          <button
            type="button"
            onClick={() => setShowCategories((v) => !v)}
            className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            {showCategories ? 'Hide categories' : 'Manage categories'}
          </button>
        </div>

        <form action={entryAction} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Type *</label>
            <select
              name="type"
              required
              value={formType}
              onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Category *</label>
            <select
              name="categoryId"
              required
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            >
              {activeCategories.length === 0 && <option value="">No categories yet</option>}
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Amount ({currency}) *</label>
            <input
              name="amountNpr"
              type="number"
              min={1}
              placeholder="1000"
              required
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Date</label>
            <input
              name="occurredAt"
              type="date"
              defaultValue={todayInputValue()}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          <div className="col-span-2 sm:col-span-4">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
            <input
              name="description"
              type="text"
              placeholder="e.g. Fabric restock from supplier"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>

          <div className="col-span-2 sm:col-span-4 flex items-center gap-4">
            <SubmitButton label="Add transaction" pendingLabel="Adding…" />
            {entryState?.error && <p className="text-sm text-red-600">{entryState.error}</p>}
          </div>
        </form>
      </div>

      {/* Category management */}
      {showCategories && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Categories</h2>

          <form action={categoryAction} className="flex flex-wrap items-end gap-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Name *</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Packaging"
                required
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Type *</label>
              <select
                name="type"
                required
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <SubmitButton label="Add category" pendingLabel="Adding…" />
            {categoryState?.error && <p className="text-sm text-red-600">{categoryState.error}</p>}
          </form>

          <div className="grid sm:grid-cols-2 gap-4">
            {(['income', 'expense'] as const).map((type) => (
              <div key={type}>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">{type}</p>
                <div className="space-y-1.5">
                  {categories.filter((c) => c.type === type).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg hover:bg-stone-50">
                      <span className={c.active ? 'text-stone-700' : 'text-stone-400 line-through'}>{c.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startTransition(() => toggleCategory(c.id, !c.active))}
                          className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          {c.active ? 'Deactivate' : 'Activate'}
                        </button>
                        {!c.isDefault && (
                          <>
                            <span className="text-stone-200">|</span>
                            <button
                              onClick={() => {
                                if (confirm(`Delete category "${c.name}"? Only possible if it has no transactions.`)) {
                                  startTransition(() => removeCategory(c.id));
                                }
                              }}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {(['all', 'income', 'expense'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filterType === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Entries table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <EmptyState
            className="border-0 rounded-none"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            }
            title="No transactions yet"
            body="Add one above, or it'll fill in automatically as customer payments come in."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredEntries.map((e) => {
                const category = categoryById.get(e.categoryId);
                const isManual = e.source === 'manual';
                return (
                  <tr key={e.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                      {new Date(e.occurredAt).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {e.description || (e.orderId ? `Order #${e.orderId}` : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        isManual ? 'bg-stone-100 text-stone-500' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {isManual ? 'Manual' : 'Auto'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                      e.type === 'income' ? 'text-emerald-600' : 'text-stone-800'
                    }`}>
                      {e.type === 'income' ? '+' : '-'}{currency} {e.amountNpr.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {isManual && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this transaction?')) {
                              startTransition(() => removeEntry(e.id));
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
