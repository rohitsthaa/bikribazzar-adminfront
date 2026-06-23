'use client';

import { useState, useTransition } from 'react';
import { saveNavItemsAction } from './actions';

interface NavItem { label: string; href: string; }

interface Props { rawNavItems: string; }

export default function NavEditor({ rawNavItems }: Props) {
  const [items, setItems] = useState<NavItem[]>(() => {
    try { return rawNavItems ? JSON.parse(rawNavItems) : []; } catch { return []; }
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function add() { setItems(prev => [...prev, { label: '', href: '' }]); setSaved(false); }
  function remove(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); setSaved(false); }
  function update(i: number, field: keyof NavItem, val: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
    setSaved(false);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]];
    setItems(next); setSaved(false);
  }
  function handleSave() {
    setError(null);
    start(async () => {
      const res = await saveNavItemsAction(items);
      if (res?.error) { setError(res.error); return; }
      setSaved(true);
    });
  }
  function handleClear() { setItems([]); setSaved(false); }

  return (
    <div className="border-t border-stone-100 pt-8 mt-2 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Navigation links</h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Custom links replace the auto-generated nav. Leave empty to use defaults (About, Gallery, Custom Orders).
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="p-0.5 rounded text-stone-300 hover:text-stone-600 disabled:opacity-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                className="p-0.5 rounded text-stone-300 hover:text-stone-600 disabled:opacity-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
            <input value={item.label} onChange={e => update(i, 'label', e.target.value)}
              placeholder="Label" className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30" />
            <input value={item.href} onChange={e => update(i, 'href', e.target.value)}
              placeholder="/about or https://..." className="flex-[2] rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30" />
            <button type="button" onClick={() => remove(i)} className="text-stone-400 hover:text-red-500 transition-colors px-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add}
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add link
      </button>

      <div className="flex items-center gap-4">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="px-5 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-40 transition-colors">
          {isPending ? 'Saving…' : 'Save nav'}
        </button>
        {items.length > 0 && (
          <button type="button" onClick={handleClear}
            className="text-sm text-stone-400 hover:text-red-500 transition-colors">
            Clear (use defaults)
          </button>
        )}
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            Saved
          </span>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
