'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { TemplateMeta, StoreSummary } from '@/lib/api';
import { grantTemplateAccessAction, revokeTemplateAccessAction } from './actions';

// ── Palette strip ─────────────────────────────────────────────────────────────

function PaletteStrip({ palette, labels }: { palette: string[]; labels: string[] }) {
  return (
    <div className="flex gap-1.5">
      {palette.map((color, i) => (
        <div key={color} className="flex flex-col items-center gap-1">
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
}: {
  template: TemplateMeta;
  stores: StoreSummary[];
  allPublicIds: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const granted = stores.filter((s) => s.allowedTemplates?.includes(template.id));

  return (
    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <PaletteStrip palette={template.palette} labels={template.paletteLabels} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-900">{template.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Exclusive</span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{template.tagline}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
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

function PublicTemplateCard({ template }: { template: TemplateMeta }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-4 py-3.5 flex items-center gap-4">
      <PaletteStrip palette={template.palette} labels={template.paletteLabels} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800">{template.name}</p>
        <p className="text-xs text-stone-400">{template.tagline}</p>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-400 font-medium">Public</span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  allTemplates: TemplateMeta[];
  stores: StoreSummary[];
}

export default function TemplatesClient({ allTemplates, stores }: Props) {
  const privateTemplates = allTemplates.filter((t) => t.access === 'private');
  const publicTemplates = allTemplates.filter((t) => t.access !== 'private');
  const allPublicIds = publicTemplates.map((t) => t.id);

  return (
    <div className="space-y-10">

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
              Set <code className="bg-stone-100 px-1 rounded">access: &quot;private&quot;</code> on any template in{' '}
              <code className="bg-stone-100 px-1 rounded">soul-thread-api/src/routes/templates.ts</code>.
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
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Public ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Public templates</h2>
          <p className="text-xs text-stone-400 mt-0.5">Available to all stores by default.</p>
        </div>
        <div className="space-y-2">
          {publicTemplates.map((t) => (
            <PublicTemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>

    </div>
  );
}
