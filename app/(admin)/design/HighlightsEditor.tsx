'use client';

import { useState, useTransition } from 'react';
import { saveHighlightsAction } from './actions';

type Highlight = { title: string; text: string };

const MAX = 6;

function parse(raw: string): Highlight[] {
  try {
    const v: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return v
      .filter((h): h is Highlight => !!h && typeof (h as Highlight).title === 'string')
      .map((h) => ({ title: h.title, text: typeof h.text === 'string' ? h.text : '' }))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

/**
 * `home_highlights` — the short selling points templates show in strips, chips and
 * marquees. Used to be hardcoded per template ("Handwoven in Nepal", "Free shipping", …),
 * which every store on that template showed whether or not it was true for them.
 */
export default function HighlightsEditor({ rawHighlights }: { rawHighlights: string }) {
  const [items, setItems] = useState<Highlight[]>(() => parse(rawHighlights));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function update(i: number, field: keyof Highlight, val: string) {
    setItems((prev) => prev.map((h, idx) => (idx === i ? { ...h, [field]: val } : h)));
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
      const res = await saveHighlightsAction(items);
      if (res.error) { setError(res.error); return; }
      setSaved(true);
    });
  }

  return (
    <div className="border-t border-stone-100 pt-8 mt-8 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Highlights</h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Up to {MAX} short selling points — e.g. &ldquo;Free delivery in Kathmandu&rdquo; or &ldquo;Made to order&rdquo;.
          Shown in your template&apos;s value strip or scrolling banner. Leave empty to show delivery and returns info
          (and your categories in banners).
        </p>
      </div>

      <div className="space-y-2">
        {items.map((h, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                className="p-0.5 rounded text-stone-300 hover:text-stone-600 disabled:opacity-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"
                className="p-0.5 rounded text-stone-300 hover:text-stone-600 disabled:opacity-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
            <div className="flex-1 grid sm:grid-cols-[1fr_2fr] gap-2">
              <input value={h.title} maxLength={40} onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="Title, e.g. Made to order"
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30" />
              <input value={h.text} maxLength={160} onChange={(e) => update(i, 'text', e.target.value)}
                placeholder="One line of detail (optional)"
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30" />
            </div>
            <button type="button" aria-label="Remove" onClick={() => { setItems((prev) => prev.filter((_, idx) => idx !== i)); setSaved(false); }}
              className="text-stone-400 hover:text-red-500 transition-colors px-1 pt-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>

      {items.length < MAX && (
        <button type="button" onClick={() => { setItems((prev) => [...prev, { title: '', text: '' }]); setSaved(false); }}
          className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add highlight
        </button>
      )}

      <div className="flex items-center gap-4">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="px-5 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-40 transition-colors">
          {isPending ? 'Saving…' : 'Save highlights'}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
