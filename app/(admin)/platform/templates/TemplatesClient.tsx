'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { TemplateMeta, StoreSummary, TemplateUpdateInput } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';
import {
  grantTemplateAccessAction,
  revokeTemplateAccessAction,
  setTemplateAccessAction,
  setShowOnMarketingAction,
  setTemplateEnabledAction,
  updateTemplateDetailsAction,
} from './actions';

// ── On/off switch (offered in pickers, signup and marketing) ────────────────────
// A template the storefront deploys for the first time arrives switched off. Switching one
// off never affects stores already on it — it only stops new stores from choosing it.

function EnabledToggle({
  template,
  onChange,
}: {
  template: TemplateMeta;
  onChange: (id: string, patch: Partial<TemplateMeta>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const on = template.enabled !== false;
  const available = template.available !== false;

  function toggle() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const result = await setTemplateEnabledAction(template.id, !on);
      if ('error' in result) setError(result.error);
      else onChange(template.id, { enabled: !on });
      setBusy(false);
    });
  }

  if (!available) {
    return (
      <span
        title="The deployed storefront no longer has this template. Stores still on it show a 'back soon' page."
        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600"
      >
        Not in storefront
      </span>
    );
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={error ?? (on
        ? 'Offered to stores, signup and the marketing site — click to switch off (stores already on it keep it)'
        : 'Switched off — not offered anywhere. Click to switch on')}
      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
        error ? 'bg-red-50 text-red-600' :
        on ? 'bg-emerald-50 text-emerald-700 hover:bg-stone-100 hover:text-stone-500'
           : 'bg-stone-100 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-stone-300'}`} />
      {busy ? '…' : on ? 'On' : 'Off'}
    </button>
  );
}

// ── Code-owned fields (read-only) ───────────────────────────────────────────────

function firstFamily(stack: string | undefined) {
  return (stack ?? '').split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') || '—';
}

function ManifestFacts({ template }: { template: TemplateMeta }) {
  const synced = template.syncedAt ? new Date(template.syncedAt).toLocaleString() : null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 space-y-2">
      <p className="text-[10px] text-stone-400">
        From the storefront&apos;s code (<code>templates/{template.id}/manifest.ts</code>) — change these there.
        {synced ? ` Last published ${synced}.` : ' Not published by a storefront deploy yet.'}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {template.palette.map((hex, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] text-stone-600">
            <span className="w-4 h-4 rounded-full border border-stone-200" style={{ backgroundColor: hex }} />
            {template.paletteLabels[i] ?? hex}
          </span>
        ))}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
        <dt className="text-stone-400">Fonts</dt>
        <dd className="text-stone-700">{firstFamily(template.fonts?.display)} / {firstFamily(template.fonts?.body)}</dd>
        <dt className="text-stone-400">Card image</dt>
        <dd className="text-stone-700">{template.cardAspect ?? '—'}</dd>
        <dt className="text-stone-400">Home sections</dt>
        <dd className="text-stone-700">{(template.homeSections ?? []).map((h) => h.label).join(' · ') || '—'}</dd>
      </dl>
    </div>
  );
}

const SITE_TYPES = ['store', 'portfolio', 'business'] as const;

// ── Marketing-visibility switch ─────────────────────────────────────────────────

function MarketingToggle({
  templateId,
  visible,
  onChange,
}: {
  templateId: string;
  visible: boolean;
  onChange: (id: string, patch: Partial<TemplateMeta>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    setBusy(true);
    startTransition(async () => {
      const next = !visible;
      const result = await setShowOnMarketingAction(templateId, next);
      if (!('error' in result)) onChange(templateId, { showOnMarketing: next });
      setBusy(false);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={
        visible
          ? 'Showing on the marketing site — click to hide'
          : 'Hidden from the marketing site — click to show'
      }
      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
        visible
          ? 'bg-sky-50 text-sky-700 hover:bg-stone-100 hover:text-stone-500'
          : 'bg-stone-100 text-stone-400 hover:bg-sky-50 hover:text-sky-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${visible ? 'bg-sky-500' : 'bg-stone-300'}`} />
      {busy ? '…' : visible ? 'On marketing site' : 'Hidden from marketing'}
    </button>
  );
}

// ── Palette strip (read-only display) ───────────────────────────────────────────

function PaletteStrip({ palette, labels }: { palette: string[]; labels: string[] }) {
  return (
    <div className="flex gap-1.5">
      {palette.map((color, i) => (
        <div key={`${color}-${i}`} className="flex flex-col items-center gap-1">
          <div
            className="w-6 h-6 rounded-full border border-black/10 shadow-sm"
            style={{ background: color }}
            title={labels[i]}
          />
        </div>
      ))}
    </div>
  );
}

// Small preview thumbnail for the list rows — falls back to the palette dots
// when a template has no marketing image set yet (the ImageUploader field in
// the edit form below), since most templates were created before that field
// existed and still only have a palette.
function TemplateThumb({ template }: { template: TemplateMeta }) {
  if (!template.imageUrl) {
    return <PaletteStrip palette={template.palette} labels={template.paletteLabels} />;
  }
  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/image?src=${encodeURIComponent(template.imageUrl)}`}
        alt={`${template.name} preview`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// ── Full details edit form ──────────────────────────────────────────────────────

const inputCls = 'mt-0.5 w-full text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400';
const labelCls = 'text-[11px] text-stone-500 block';

function TemplateEditForm({
  template,
  onSaved,
  onClose,
}: {
  template: TemplateMeta;
  onSaved: (id: string, patch: Partial<TemplateMeta>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [tagline, setTagline] = useState(template.tagline);
  const [description, setDescription] = useState(template.description);
  const [demoUrl, setDemoUrl] = useState(template.demoUrl ?? '');
  const [imageUrl, setImageUrl] = useState(template.imageUrl ?? '');
  const [sortOrder, setSortOrder] = useState(template.sortOrder ?? 0);
  const [isPremium, setIsPremium] = useState(template.isPremium ?? false);
  const [siteTypes, setSiteTypes] = useState<string[]>(template.siteTypes ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleSiteType(type: string) {
    setSiteTypes((cur) => (cur.includes(type) ? cur.filter((t) => t !== type) : [...cur, type]));
  }

  function save() {
    setSaving(true);
    setError(null);
    const patch: TemplateUpdateInput = {
      name, tagline, description, demoUrl, imageUrl, sortOrder, isPremium, siteTypes,
    };
    startTransition(async () => {
      const result = await updateTemplateDetailsAction(template.id, patch);
      if ('error' in result) {
        setError(result.error);
      } else {
        onSaved(template.id, patch);
        onClose();
      }
      setSaving(false);
    });
  }

  return (
    <div className="border-t border-stone-100 px-4 py-3.5 space-y-3 bg-stone-50">
      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>
          Name
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={labelCls}>
          Demo URL
          <input className={inputCls} value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <label className={labelCls}>
        Tagline
        <input className={inputCls} value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </label>

      <label className={labelCls}>
        Description
        <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div>
        <p className={labelCls}>Marketing preview image</p>
        <p className="text-[10px] text-stone-400 mt-0.5 mb-1.5">
          Shown on the bikribazaar.com template showcase card. Leave empty to keep the CSS
          mockup preview instead.
        </p>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
      </div>

      <ManifestFacts template={template} />

      <div className="flex items-center gap-5">
        <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
          Sort order
          <input
            type="number"
            className="w-16 text-sm border border-stone-200 rounded-lg px-2 py-1"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </label>
        <label className="text-[11px] text-stone-500 flex items-center gap-1.5">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          Premium
        </label>
        <span className="text-[11px] text-stone-500 flex items-center gap-2">
          Suits
          {SITE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-1">
              <input type="checkbox" checked={siteTypes.includes(type)} onChange={() => toggleSiteType(type)} />
              {type}
            </label>
          ))}
        </span>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save details'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="text-[11px] font-medium px-3 py-1.5 rounded-full text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Store assignment row ───────────────────────────────────────────────────────

function StoreRow({
  store,
  templateId,
  hasAccess,
  allPublicIds,
}: {
  store: StoreSummary;
  templateId: string;
  hasAccess: boolean;
  allPublicIds: string[];
}) {
  const [granted, setGranted] = useState(hasAccess);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    setBusy(true);
    startTransition(async () => {
      const result = granted
        ? await revokeTemplateAccessAction(store.id, templateId)
        : await grantTemplateAccessAction(store.id, templateId, allPublicIds);
      if (!('error' in result)) setGranted(!granted);
      setBusy(false);
    });
  }

  return (
    <div className="flex items-center justify-between py-2.5 px-4 hover:bg-stone-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-[11px] font-bold text-stone-500 uppercase flex-shrink-0">
          {store.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">{store.name}</p>
          <p className="text-[11px] text-stone-400">{store.id}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {store.allowedTemplates === null && !granted && (
          <span className="text-[10px] text-stone-400">unrestricted</span>
        )}
        <button
          onClick={toggle}
          disabled={busy}
          className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors disabled:opacity-50 ${
            granted
              ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600'
              : 'bg-stone-100 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          {busy ? '…' : granted ? 'Revoke' : 'Grant'}
        </button>
        <Link
          href={`/platform/${store.id}`}
          className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
          title="Open store settings"
        >
          →
        </Link>
      </div>
    </div>
  );
}

// ── Private template card ──────────────────────────────────────────────────────

function PrivateTemplateCard({
  template,
  stores,
  allPublicIds,
  onMakePublic,
  onOverride,
}: {
  template: TemplateMeta;
  stores: StoreSummary[];
  allPublicIds: string[];
  onMakePublic: (id: string) => void;
  onOverride: (id: string, patch: Partial<TemplateMeta>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const granted = stores.filter((s) => s.allowedTemplates?.includes(template.id));

  async function makePublic() {
    setBusy(true);
    startTransition(async () => {
      const result = await setTemplateAccessAction(template.id, 'public');
      if (!('error' in result)) onMakePublic(template.id);
      setBusy(false);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <TemplateThumb template={template} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-900">{template.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Exclusive</span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{template.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <EnabledToggle template={template} onChange={onOverride} />
          <MarketingToggle templateId={template.id} visible={template.showOnMarketing ?? true} onChange={onOverride} />
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            Edit details
          </button>
          <button
            onClick={makePublic}
            disabled={busy}
            title="Make this template public (available to all stores)"
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {busy ? '…' : 'Make public'}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
          >
            <span className="font-medium">{granted.length} store{granted.length !== 1 ? 's' : ''}</span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {editing && (
        <TemplateEditForm template={template} onSaved={onOverride} onClose={() => setEditing(false)} />
      )}

      {/* Expanded store list */}
      {expanded && (
        <div className="border-t border-amber-100">
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
            <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">Store access — click to grant or revoke</p>
          </div>
          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {stores.map((store) => (
              <StoreRow
                key={store.id}
                store={store}
                templateId={template.id}
                hasAccess={!!store.allowedTemplates?.includes(template.id)}
                allPublicIds={allPublicIds}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public template card ───────────────────────────────────────────────────────

function PublicTemplateCard({
  template,
  onMakeExclusive,
  onOverride,
}: {
  template: TemplateMeta;
  onMakeExclusive: (id: string) => void;
  onOverride: (id: string, patch: Partial<TemplateMeta>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function makeExclusive() {
    setBusy(true);
    startTransition(async () => {
      const result = await setTemplateAccessAction(template.id, 'private');
      if (!('error' in result)) onMakeExclusive(template.id);
      setBusy(false);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3.5 flex items-center gap-4">
        <TemplateThumb template={template} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800">{template.name}</p>
          <p className="text-xs text-stone-400">{template.tagline}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <EnabledToggle template={template} onChange={onOverride} />
          <MarketingToggle templateId={template.id} visible={template.showOnMarketing ?? true} onChange={onOverride} />
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            Edit details
          </button>
          <button
            onClick={makeExclusive}
            disabled={busy}
            title="Make exclusive — only stores you grant access can use this template"
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors disabled:opacity-50"
          >
            {busy ? '…' : 'Make exclusive'}
          </button>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-400 font-medium">Public</span>
        </div>
      </div>

      {editing && (
        <TemplateEditForm template={template} onSaved={onOverride} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  allTemplates: TemplateMeta[];
  stores: StoreSummary[];
}

export default function TemplatesClient({ allTemplates, stores }: Props) {
  // Local overrides so every edit (access, marketing visibility, name/tagline/palette/demoUrl/…)
  // reflects immediately without a page reload. The server action already persisted it — this
  // is purely optimistic-UI bookkeeping.
  const [overrides, setOverrides] = useState<Record<string, Partial<TemplateMeta>>>({});

  function applyOverride(id: string, patch: Partial<TemplateMeta>) {
    setOverrides((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  }

  const templates = allTemplates
    .map((t) => ({ ...t, ...overrides[t.id] }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const switchedOff = templates.filter((t) => t.available !== false && t.enabled === false);
  const gone = templates.filter((t) => t.available === false);
  const privateTemplates = templates.filter((t) => (t.access ?? 'public') === 'private');
  const publicTemplates  = templates.filter((t) => (t.access ?? 'public') !== 'private');
  const allPublicIds = publicTemplates.map((t) => t.id);

  function makePublic(id: string) {
    applyOverride(id, { access: 'public' });
  }
  function makeExclusive(id: string) {
    applyOverride(id, { access: 'private' });
  }

  return (
    <div className="space-y-10">
      {(switchedOff.length > 0 || gone.length > 0) && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600 space-y-1">
          {switchedOff.length > 0 && (
            <p>
              <strong className="font-medium">Switched off:</strong> {switchedOff.map((t) => t.name).join(', ')}.
              New templates from a storefront deploy arrive switched off — add a tagline, description and
              preview image, then switch them on.
            </p>
          )}
          {gone.length > 0 && (
            <p>
              <strong className="font-medium text-red-600">Not in the storefront:</strong> {gone.map((t) => t.name).join(', ')}.
              The latest storefront deploy doesn&apos;t include them; stores still on them show a &ldquo;back soon&rdquo; page.
            </p>
          )}
        </div>
      )}

      {/* ── Exclusive ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Exclusive templates</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Private themes — only visible to stores you explicitly assign them to.
          </p>
        </div>

        {privateTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 px-6 py-10 text-center">
            <p className="text-sm text-stone-400">No exclusive templates yet.</p>
            <p className="text-xs text-stone-400 mt-1">
              Click <strong className="font-medium text-stone-500">Make exclusive</strong> on any public template below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {privateTemplates.map((t) => (
              <PrivateTemplateCard
                key={t.id}
                template={t}
                stores={stores}
                allPublicIds={allPublicIds}
                onMakePublic={makePublic}
                onOverride={applyOverride}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Public ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Public templates</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Available to all stores by default. The blue toggle controls whether a template
            appears in the showcase on the marketing site (bikribazaar.com); the green one switches
            it on or off everywhere (stores already on it keep it). &ldquo;Edit details&rdquo; edits name,
            tagline, description, image, demo link, sort order, premium and site types. Colours,
            fonts, card shape and home sections come from the storefront code and show read-only.
          </p>
        </div>
        <div className="space-y-2">
          {publicTemplates.map((t) => (
            <PublicTemplateCard
              key={t.id}
              template={t}
              onMakeExclusive={makeExclusive}
              onOverride={applyOverride}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
