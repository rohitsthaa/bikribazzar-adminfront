'use client';

import { useState, useTransition } from 'react';
import { saveFontsAction } from './actions';
import { FONT_CHOICES, firstFamily, googleFontsHref } from '@/lib/fonts';

interface Props {
  /** The template's default stacks (TemplateMeta.fonts). */
  templateFonts: { display: string; body: string } | null;
  initialDisplay: string;
  initialBody: string;
}

const OTHER = '__other__';

function FontSelect({ label, hint, value, onChange, templateDefault }: {
  label: string; hint: string; value: string; onChange: (v: string) => void; templateDefault: string;
}) {
  const inList = value === '' || FONT_CHOICES.some((f) => f.family === value);
  const [custom, setCustom] = useState(!inList);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-stone-600">{label}</label>
      <select
        value={custom ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) { setCustom(true); return; }
          setCustom(false);
          onChange(e.target.value);
        }}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
      >
        <option value="">Template default{templateDefault ? ` (${templateDefault})` : ''}</option>
        {(['sans', 'serif', 'display', 'script'] as const).map((kind) => (
          <optgroup key={kind} label={{ sans: 'Sans serif', serif: 'Serif', display: 'Display', script: 'Script' }[kind]}>
            {FONT_CHOICES.filter((f) => f.kind === kind).map((f) => (
              <option key={f.family} value={f.family}>{f.family}</option>
            ))}
          </optgroup>
        ))}
        <option value={OTHER}>Another Google Font…</option>
      </select>
      {custom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Exact Google Fonts family name, e.g. Josefin Sans"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
        />
      )}
      <p className="text-[11px] text-stone-400">{hint}</p>
    </div>
  );
}

export default function FontsEditor({ templateFonts, initialDisplay, initialBody }: Props) {
  const [display, setDisplay] = useState(initialDisplay);
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const defaultDisplay = firstFamily(templateFonts?.display);
  const defaultBody = firstFamily(templateFonts?.body);
  const previewDisplay = display.trim() || defaultDisplay;
  const previewBody = body.trim() || defaultBody;
  const href = googleFontsHref([previewDisplay, previewBody]);

  function handleSave() {
    setError(null);
    start(async () => {
      const res = await saveFontsAction({ display, body });
      if (res.error) { setError(res.error); return; }
      setSaved(true);
    });
  }

  return (
    <div className="border-t border-stone-100 pt-8 mt-8 space-y-4">
      {href && <link rel="stylesheet" href={href} />}
      <div>
        <h2 className="text-base font-semibold text-stone-900">Fonts</h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Your template picks fonts that suit it. Choose your own here — they stay if you switch templates.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FontSelect label="Headings" hint="Store name, page titles and section headings."
          value={display} onChange={(v) => { setDisplay(v); setSaved(false); }} templateDefault={defaultDisplay} />
        <FontSelect label="Body text" hint="Paragraphs, buttons, menus and prices."
          value={body} onChange={(v) => { setBody(v); setSaved(false); }} templateDefault={defaultBody} />
      </div>

      <div className="rounded-xl border border-stone-100 bg-stone-50 px-5 py-4">
        <p className="text-2xl text-stone-900" style={{ fontFamily: `'${previewDisplay}', serif` }}>Handmade, with care</p>
        <p className="text-sm text-stone-600 mt-1" style={{ fontFamily: `'${previewBody}', sans-serif` }}>
          Every piece is made to order and delivered across the valley within three days.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="px-5 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-40 transition-colors">
          {isPending ? 'Saving…' : 'Save fonts'}
        </button>
        {(display || body) && (
          <button type="button" onClick={() => { setDisplay(''); setBody(''); setSaved(false); }}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            Use template fonts
          </button>
        )}
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
