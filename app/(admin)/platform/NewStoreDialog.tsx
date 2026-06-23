'use client';

import { useState, useRef, useTransition } from 'react';
import { createStoreAction } from './actions';
import { TEMPLATES } from './templates';

export default function NewStoreDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isPending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const fd = new FormData(formRef.current!);
    const id = (fd.get('id') as string).trim().toLowerCase();
    const name = (fd.get('name') as string).trim();
    if (!id || !name) { setError('Slug and name are required.'); return; }
    if (!/^[a-z0-9-]+$/.test(id)) { setError('Slug can only contain lowercase letters, numbers and hyphens.'); return; }
    start(async () => {
      // createStoreAction redirects on success, so no need to close manually.
      await createStoreAction(fd);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#c96a3a] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#b85f33] transition-colors shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New store
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Create a store</h2>
                <p className="text-xs text-stone-400 mt-0.5">The slug is permanent and becomes the default subdomain.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0 mt-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-stone-600">Slug <span className="text-stone-400 font-normal">(permanent)</span></span>
                <input
                  name="id"
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="acme-store"
                  autoComplete="off"
                  autoFocus
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
                />
                <p className="text-[11px] text-stone-400 mt-1">Used as <code className="bg-stone-100 px-1 rounded">slug.store.helloworldnepal.com</code></p>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-stone-600">Store name</span>
                <input
                  name="name"
                  required
                  placeholder="Acme Store"
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-stone-600">Template</span>
                <select
                  name="templateId"
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-[#c96a3a] text-white py-2.5 text-sm font-medium hover:bg-[#b85f33] disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Creating…' : 'Create store'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
