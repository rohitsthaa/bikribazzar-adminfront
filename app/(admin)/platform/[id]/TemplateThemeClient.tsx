'use client';

import { useState, useTransition } from 'react';
import { updateStoreTemplateThemeAction } from '../actions';
import { TemplateMockup } from '@/app/signup/TemplateMockup';
import type { TemplateMeta } from '@/lib/api';
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

// A template is off-limits to this store unless it's public and the store is
// unrestricted, or it's explicitly named in the store's AllowedTemplates list.
// Mirrors the "effective access" logic TemplateAccessClient uses to seed its
// checkboxes, so this picker and the access-grant panel below never disagree
// about what's actually usable. Locking a card here is just a clear UX signal —
// PATCH /stores/:id is the real enforcement (see StoreEndpoints.cs).
function isLocked(t: TemplateMeta, allowedTemplates: string[] | null): boolean {
  if (allowedTemplates === null) return t.access === 'private';
  return !allowedTemplates.includes(t.id);
}

function TemplateCard({
  template,
  selected,
  locked,
  onSelect,
}: {
  template: TemplateMeta;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onSelect}
      disabled={locked}
      title={locked ? 'Not granted to this store — grant access in "Template access" below to enable.' : undefined}
      className={`text-left rounded-xl border overflow-hidden transition-all bg-white ${
        selected
          ? 'border-[#c96a3a] ring-2 ring-[#c96a3a]/30'
          : locked
          ? 'border-stone-200 opacity-50 cursor-not-allowed'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="h-24 border-b border-stone-100 overflow-hidden relative">
        {template.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image?src=${encodeURIComponent(template.imageUrl)}`}
            alt={`${template.name} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <TemplateMockup id={template.id} size="sm" />
        )}
        {selected && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#c96a3a] text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        )}
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold text-stone-800 truncate">{template.name}</p>
          {locked && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 flex-shrink-0">
              <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          )}
        </div>
        <p className="text-[11px] text-stone-400 truncate">{template.tagline}</p>
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1">
            {template.palette.slice(0, 4).map((color, i) => (
              <span key={`${color}-${i}`} className="w-3 h-3 rounded-full border border-black/10" style={{ background: color }} />
            ))}
          </div>
          <div className="flex gap-1">
            {template.isPremium && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Premium</span>
            )}
            {template.access === 'private' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">Private</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function TemplateThemeClient({
  storeId,
  storeName,
  storeStatus,
  customDomain,
  initialTemplateId,
  initialTheme,
  allTemplates,
  allowedTemplates,
}: {
  storeId: string;
  storeName: string;
  storeStatus: string;
  customDomain: string | null;
  initialTemplateId: string;
  initialTheme: ThemeShape;
  allTemplates: TemplateMeta[];
  allowedTemplates: string[] | null;
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

  const templates = [...allTemplates].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  function selectTemplate(id: string) {
    setTemplateId(id);
    // Clear custom overrides so the new template's default palette applies.
    // Operators can re-set individual colors after switching.
    setPrimary('');
    setAccent('');
    setBg('');
  }

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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={t.id === templateId}
              locked={isLocked(t, allowedTemplates) && t.id !== templateId}
              onSelect={() => selectTemplate(t.id)}
            />
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-2.5">
          Picking a template resets custom colours to its defaults — save to apply. Locked/private templates
          need to be granted below first; premium templates need a plan that allows them.
        </p>
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
