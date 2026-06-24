'use client';

import { useState, useTransition } from 'react';
import { updateStoreTemplateThemeAction } from '../actions';
import { TEMPLATES } from '../templates';
import ColorInput from './ColorInput';

type ThemeShape = { colors?: { primary?: string; accent?: string; bg?: string }; fonts?: { display?: string; body?: string } };

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-stone-600 mb-1.5">{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60 ${props.className ?? ''}`}
    />
  );
}

export default function TemplateThemeClient({
  storeId,
  storeName,
  storeStatus,
  customDomain,
  initialTemplateId,
  initialTheme,
}: {
  storeId: string;
  storeName: string;
  storeStatus: string;
  customDomain: string | null;
  initialTemplateId: string;
  initialTheme: ThemeShape;
}) {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [primary, setPrimary] = useState(initialTheme.colors?.primary ?? '');
  const [accent, setAccent] = useState(initialTheme.colors?.accent ?? '');
  const [bg, setBg] = useState(initialTheme.colors?.bg ?? '');
  const [fontDisplay, setFontDisplay] = useState(initialTheme.fonts?.display ?? '');
  const [fontBody, setFontBody] = useState(initialTheme.fonts?.body ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const theme = {
        colors: {
          ...(primary ? { primary } : {}),
          ...(accent ? { accent } : {}),
          ...(bg ? { bg } : {}),
        },
        fonts: {
          ...(fontDisplay ? { display: fontDisplay } : {}),
          ...(fontBody ? { body: fontBody } : {}),
        },
      };
      const result = await updateStoreTemplateThemeAction(storeId, {
        name: storeName,
        status: storeStatus,
        customDomain: customDomain,
        templateId,
        theme,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Template</Label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
        >
          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <p className="text-[11px] text-stone-400 mt-1.5">Changing this updates the storefront layout immediately.</p>
      </div>

      <div>
        <p className="text-xs font-medium text-stone-600 mb-3">
          Theme overrides <span className="text-stone-400 font-normal">— leave blank to use template defaults</span>
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <ColorInput name="primary" label="Primary colour" value={primary} onChange={setPrimary} placeholder="#c96a3a" />
          <ColorInput name="accent"  label="Accent colour"  value={accent}  onChange={setAccent}  placeholder="#3d2c1e" />
          <ColorInput name="bg"      label="Background"     value={bg}      onChange={setBg}      placeholder="#faf8f5" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Display font <span className="text-stone-400 font-normal">(Google Fonts name)</span></Label>
          <Input value={fontDisplay} onChange={(e) => setFontDisplay(e.target.value)} placeholder="Cormorant Garamond" />
        </div>
        <div>
          <Label>Body font <span className="text-stone-400 font-normal">(Google Fonts name)</span></Label>
          <Input value={fontBody} onChange={(e) => setFontBody(e.target.value)} placeholder="Inter" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-stone-800 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Saved
          </span>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
