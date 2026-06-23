'use client';

import { useState, useTransition } from 'react';
import { setTemplateAction, saveSectionsAction } from './actions';
import { SECTION_REGISTRY, parseSections, type HomeSection } from '@/lib/home-sections';
import type { TemplateMeta } from '@/lib/api';

// ---------------------------------------------------------------------------
// SVG previews keyed by template ID — purely client-side presentational layer.
// When the API returns a template ID that has no preview here, a colour-swatch
// fallback is shown instead. Add a new entry here whenever a new template is
// built; no other admin changes are needed.
// ---------------------------------------------------------------------------

const TEMPLATE_PREVIEWS: Record<string, React.ReactNode> = {
  soulthread: (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="180" fill="#faf8f5" />
      <rect width="280" height="28" fill="#faf8f5" />
      <rect x="12" y="9" width="40" height="7" rx="2" fill="#c96a3a" opacity="0.8" />
      <rect x="180" y="10" width="22" height="5" rx="1" fill="#7a6a5a" opacity="0.4" />
      <rect x="208" y="10" width="22" height="5" rx="1" fill="#7a6a5a" opacity="0.4" />
      <rect x="236" y="10" width="22" height="5" rx="1" fill="#7a6a5a" opacity="0.4" />
      <rect y="28" width="280" height="52" fill="#f0ebe3" />
      <rect x="12" y="36" width="70" height="10" rx="2" fill="#3d2c1e" opacity="0.7" />
      <rect x="12" y="50" width="50" height="6" rx="1" fill="#7a6a5a" opacity="0.4" />
      <rect x="12" y="60" width="80" height="6" rx="1" fill="#7a6a5a" opacity="0.3" />
      <rect x="12" y="70" width="30" height="8" rx="4" fill="#c96a3a" opacity="0.9" />
      <rect x="160" y="30" width="108" height="44" rx="4" fill="#ddd5c8" />
      <circle cx="214" cy="52" r="12" fill="#c8b99a" opacity="0.6" />
      <path d="M204 58 l10-14 l10 14 z" fill="#c96a3a" opacity="0.3" />
      <rect x="12" y="88" width="60" height="9" rx="2" fill="#3d2c1e" opacity="0.5" />
      <rect x="12" y="102" width="74" height="64" rx="4" fill="#fff" stroke="#e8e0d6" strokeWidth="0.5" />
      <rect x="12" y="102" width="74" height="38" rx="4" fill="#e8ddd0" />
      <rect x="20" y="146" width="40" height="5" rx="1" fill="#3d2c1e" opacity="0.5" />
      <rect x="20" y="154" width="25" height="5" rx="1" fill="#c96a3a" opacity="0.6" />
      <rect x="93" y="102" width="74" height="64" rx="4" fill="#fff" stroke="#e8e0d6" strokeWidth="0.5" />
      <rect x="93" y="102" width="74" height="38" rx="4" fill="#ddd5c8" />
      <rect x="101" y="146" width="40" height="5" rx="1" fill="#3d2c1e" opacity="0.5" />
      <rect x="101" y="154" width="25" height="5" rx="1" fill="#c96a3a" opacity="0.6" />
      <rect x="174" y="102" width="74" height="64" rx="4" fill="#fff" stroke="#e8e0d6" strokeWidth="0.5" />
      <rect x="174" y="102" width="74" height="38" rx="4" fill="#cfc4b4" />
      <rect x="182" y="146" width="40" height="5" rx="1" fill="#3d2c1e" opacity="0.5" />
      <rect x="182" y="154" width="25" height="5" rx="1" fill="#c96a3a" opacity="0.6" />
    </svg>
  ),
  aurora: (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="180" fill="#ffffff" />
      <rect width="280" height="28" fill="#fff" />
      <rect x="12" y="10" width="32" height="6" rx="1" fill="#18181b" opacity="0.8" />
      <rect x="180" y="11" width="20" height="4" rx="1" fill="#71717a" opacity="0.5" />
      <rect x="206" y="11" width="20" height="4" rx="1" fill="#71717a" opacity="0.5" />
      <rect x="232" y="11" width="20" height="4" rx="1" fill="#71717a" opacity="0.5" />
      <rect y="26" width="280" height="0.5" fill="#e4e4e7" />
      <rect y="28" width="280" height="52" fill="#f4f4f5" />
      <rect x="12" y="37" width="80" height="11" rx="2" fill="#18181b" opacity="0.8" />
      <rect x="12" y="52" width="55" height="5" rx="1" fill="#71717a" opacity="0.5" />
      <rect x="12" y="61" width="70" height="5" rx="1" fill="#71717a" opacity="0.35" />
      <rect x="12" y="70" width="36" height="7" rx="2" fill="#18181b" opacity="0.85" />
      <rect x="160" y="30" width="108" height="44" rx="3" fill="#e4e4e7" />
      <rect x="175" y="42" width="78" height="20" rx="2" fill="#d4d4d8" opacity="0.7" />
      <rect x="12" y="90" width="256" height="0.5" fill="#e4e4e7" />
      <rect x="12" y="96" width="55" height="7" rx="1" fill="#18181b" opacity="0.6" />
      <rect x="12" y="108" width="72" height="62" rx="3" fill="#f4f4f5" />
      <rect x="12" y="108" width="72" height="38" rx="3" fill="#e4e4e7" />
      <rect x="18" y="152" width="38" height="4" rx="1" fill="#18181b" opacity="0.55" />
      <rect x="18" y="159" width="24" height="4" rx="1" fill="#18181b" opacity="0.8" />
      <rect x="92" y="108" width="72" height="62" rx="3" fill="#f4f4f5" />
      <rect x="92" y="108" width="72" height="38" rx="3" fill="#d4d4d8" />
      <rect x="98" y="152" width="38" height="4" rx="1" fill="#18181b" opacity="0.55" />
      <rect x="98" y="159" width="24" height="4" rx="1" fill="#18181b" opacity="0.8" />
      <rect x="172" y="108" width="72" height="62" rx="3" fill="#f4f4f5" />
      <rect x="172" y="108" width="72" height="38" rx="3" fill="#e4e4e7" />
      <rect x="178" y="152" width="38" height="4" rx="1" fill="#18181b" opacity="0.55" />
      <rect x="178" y="159" width="24" height="4" rx="1" fill="#18181b" opacity="0.8" />
    </svg>
  ),
  bloom: (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="180" fill="#f7f4ef" />
      <rect width="280" height="28" fill="#f7f4ef" />
      <rect x="12" y="9" width="8" height="8" rx="4" fill="#5a7d5a" />
      <rect x="24" y="11" width="36" height="5" rx="1" fill="#2d3a2d" opacity="0.7" />
      <rect x="180" y="11" width="20" height="4" rx="1" fill="#4a5e4a" opacity="0.4" />
      <rect x="206" y="11" width="20" height="4" rx="1" fill="#4a5e4a" opacity="0.4" />
      <rect x="240" y="8" width="28" height="10" rx="5" fill="#5a7d5a" opacity="0.9" />
      <rect y="27" width="280" height="0.5" fill="#d6cfc4" />
      <rect y="28" width="280" height="54" fill="#f7f4ef" />
      <rect x="12" y="36" width="8" height="4" rx="1" fill="#5a7d5a" opacity="0.6" />
      <rect x="12" y="44" width="90" height="10" rx="2" fill="#2d3a2d" opacity="0.75" />
      <rect x="12" y="57" width="65" height="5" rx="1" fill="#4a5e4a" opacity="0.4" />
      <rect x="12" y="66" width="34" height="9" rx="5" fill="#5a7d5a" opacity="0.9" />
      <rect x="158" y="30" width="110" height="46" rx="12" fill="#e0dbd0" />
      <circle cx="213" cy="53" r="14" fill="#d6cfc4" opacity="0.7" />
      <rect y="88" width="280" height="0.5" fill="#d6cfc4" opacity="0.6" />
      <rect x="12" y="94" width="70" height="7" rx="2" fill="#2d3a2d" opacity="0.5" />
      <rect x="12" y="106" width="74" height="64" rx="12" fill="#f0ebe4" stroke="#d6cfc4" strokeWidth="0.5" />
      <rect x="12" y="106" width="74" height="38" rx="12" fill="#e0d9d0" />
      <rect x="20" y="150" width="38" height="5" rx="1" fill="#2d3a2d" opacity="0.5" />
      <rect x="20" y="158" width="24" height="4" rx="1" fill="#c4835a" opacity="0.7" />
      <rect x="93" y="106" width="74" height="64" rx="12" fill="#f0ebe4" stroke="#d6cfc4" strokeWidth="0.5" />
      <rect x="93" y="106" width="74" height="38" rx="12" fill="#d6d0c5" />
      <rect x="101" y="150" width="38" height="5" rx="1" fill="#2d3a2d" opacity="0.5" />
      <rect x="101" y="158" width="24" height="4" rx="1" fill="#c4835a" opacity="0.7" />
      <rect x="174" y="106" width="74" height="64" rx="12" fill="#f0ebe4" stroke="#d6cfc4" strokeWidth="0.5" />
      <rect x="174" y="106" width="74" height="38" rx="12" fill="#c8c2b5" />
      <rect x="182" y="150" width="38" height="5" rx="1" fill="#2d3a2d" opacity="0.5" />
      <rect x="182" y="158" width="24" height="4" rx="1" fill="#c4835a" opacity="0.7" />
    </svg>
  ),
  coastal: (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="180" fill="#f5f0e8" />
      <rect width="280" height="28" fill="#f5f0e8" opacity="0.92" />
      <rect x="12" y="9" width="10" height="10" rx="3" fill="#2d7d9a" />
      <rect x="26" y="11" width="36" height="5" rx="1" fill="#1a3040" opacity="0.7" />
      <rect x="178" y="11" width="20" height="4" rx="1" fill="#1a3040" opacity="0.4" />
      <rect x="204" y="11" width="20" height="4" rx="1" fill="#1a3040" opacity="0.4" />
      <rect x="238" y="8" width="30" height="10" rx="3" fill="#2d7d9a" opacity="0.9" />
      <rect y="27" width="280" height="0.5" fill="#d9d0c0" />
      <defs>
        <linearGradient id="coastalHero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3040" />
          <stop offset="100%" stopColor="#2d7d9a" />
        </linearGradient>
      </defs>
      <rect y="28" width="280" height="54" fill="url(#coastalHero)" />
      <rect x="12" y="37" width="8" height="3" rx="1" fill="#7ec8e3" opacity="0.7" />
      <rect x="12" y="44" width="88" height="10" rx="2" fill="#f5f0e8" opacity="0.9" />
      <rect x="12" y="57" width="60" height="5" rx="1" fill="#f5f0e8" opacity="0.5" />
      <rect x="12" y="66" width="36" height="9" rx="3" fill="#2d7d9a" opacity="0.9" />
      <rect x="54" y="66" width="36" height="9" rx="3" fill="none" stroke="#f5f0e8" strokeWidth="0.8" opacity="0.5" />
      <rect x="158" y="30" width="110" height="46" rx="8" fill="#1a3040" opacity="0.5" />
      <rect x="166" y="38" width="94" height="30" rx="4" fill="#2d7d9a" opacity="0.4" />
      <rect y="88" width="280" height="0.5" fill="#d9d0c0" opacity="0.6" />
      <rect x="12" y="94" width="60" height="7" rx="1" fill="#1a3040" opacity="0.5" />
      <rect x="12" y="106" width="74" height="64" rx="8" fill="#ede8de" stroke="#d9d0c0" strokeWidth="0.5" />
      <rect x="12" y="106" width="74" height="38" rx="8" fill="#ddd5c5" />
      <rect x="20" y="150" width="38" height="5" rx="1" fill="#1a3040" opacity="0.6" />
      <rect x="20" y="158" width="24" height="4" rx="1" fill="#c49a6c" opacity="0.8" />
      <rect x="93" y="106" width="74" height="64" rx="8" fill="#ede8de" stroke="#d9d0c0" strokeWidth="0.5" />
      <rect x="93" y="106" width="74" height="38" rx="8" fill="#c8c0b0" />
      <rect x="101" y="150" width="38" height="5" rx="1" fill="#1a3040" opacity="0.6" />
      <rect x="101" y="158" width="24" height="4" rx="1" fill="#c49a6c" opacity="0.8" />
      <rect x="174" y="106" width="74" height="64" rx="8" fill="#ede8de" stroke="#d9d0c0" strokeWidth="0.5" />
      <rect x="174" y="106" width="74" height="38" rx="8" fill="#d5cdc0" />
      <rect x="182" y="150" width="38" height="5" rx="1" fill="#1a3040" opacity="0.6" />
      <rect x="182" y="158" width="24" height="4" rx="1" fill="#c49a6c" opacity="0.8" />
    </svg>
  ),
  neon: (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="180" fill="#0a0a0b" />
      {/* Nav */}
      <rect width="280" height="28" fill="#111113" />
      <rect x="12" y="9" width="38" height="8" rx="4" fill="#00e5ff" opacity="0.9" />
      <rect x="180" y="11" width="20" height="4" rx="1" fill="#ffffff" opacity="0.25" />
      <rect x="206" y="11" width="20" height="4" rx="1" fill="#ffffff" opacity="0.25" />
      <rect x="234" y="8" width="34" height="10" rx="5" fill="#00e5ff" opacity="0.85" />
      {/* Hero glow */}
      <ellipse cx="140" cy="62" rx="100" ry="30" fill="#00e5ff" opacity="0.06" />
      <rect y="30" width="280" height="52" fill="transparent" />
      <rect x="12" y="38" width="78" height="11" rx="2" fill="#ffffff" opacity="0.85" />
      <rect x="12" y="53" width="52" height="5" rx="1" fill="#ffffff" opacity="0.3" />
      <rect x="12" y="62" width="64" height="5" rx="1" fill="#ffffff" opacity="0.18" />
      <rect x="12" y="72" width="36" height="8" rx="4" fill="#00e5ff" opacity="0.9" />
      <rect x="54" y="72" width="36" height="8" rx="4" fill="none" stroke="#7c3aff" strokeWidth="1" opacity="0.8" />
      <rect x="160" y="32" width="108" height="44" rx="6" fill="#111113" stroke="#00e5ff" strokeWidth="0.5" opacity="0.8" />
      <rect x="174" y="44" width="80" height="20" rx="3" fill="#7c3aff" opacity="0.3" />
      {/* Products */}
      <rect x="12" y="94" width="60" height="7" rx="1" fill="#ffffff" opacity="0.4" />
      <rect x="12" y="106" width="74" height="64" rx="6" fill="#111113" stroke="#ffffff" strokeWidth="0.3" opacity="0.6" />
      <rect x="12" y="106" width="74" height="38" rx="6" fill="#1a1a1e" />
      <rect x="20" y="150" width="38" height="4" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="20" y="158" width="25" height="4" rx="1" fill="#00e5ff" opacity="0.8" />
      <rect x="93" y="106" width="74" height="64" rx="6" fill="#111113" stroke="#ffffff" strokeWidth="0.3" opacity="0.6" />
      <rect x="93" y="106" width="74" height="38" rx="6" fill="#16101e" />
      <rect x="101" y="150" width="38" height="4" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="101" y="158" width="25" height="4" rx="1" fill="#7c3aff" opacity="0.8" />
      <rect x="174" y="106" width="74" height="64" rx="6" fill="#111113" stroke="#ffffff" strokeWidth="0.3" opacity="0.6" />
      <rect x="174" y="106" width="74" height="38" rx="6" fill="#0d1419" />
      <rect x="182" y="150" width="38" height="4" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="182" y="158" width="25" height="4" rx="1" fill="#00e5ff" opacity="0.8" />
    </svg>
  ),
  bubbly: (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="180" fill="#fff8f3" />
      {/* Decorative blobs */}
      <circle cx="240" cy="20" r="30" fill="#ff4d6d" opacity="0.08" />
      <circle cx="20" cy="160" r="24" fill="#ffd60a" opacity="0.12" />
      {/* Nav */}
      <rect width="280" height="28" fill="#fff8f3" />
      <rect x="12" y="8" width="50" height="12" rx="6" fill="#ff4d6d" opacity="0.15" />
      <rect x="16" y="11" width="42" height="6" rx="3" fill="#ff4d6d" opacity="0.7" />
      <rect x="174" y="11" width="22" height="5" rx="2.5" fill="#1a0a00" opacity="0.2" />
      <rect x="202" y="11" width="22" height="5" rx="2.5" fill="#1a0a00" opacity="0.2" />
      <rect x="232" y="8" width="36" height="11" rx="5.5" fill="#ff4d6d" opacity="0.9" />
      <rect y="27" width="280" height="0.5" fill="#ffd60a" opacity="0.4" />
      {/* Hero */}
      <rect y="28" width="280" height="52" fill="#fff8f3" />
      <rect x="12" y="36" width="82" height="12" rx="3" fill="#1a0a00" opacity="0.8" />
      <rect x="12" y="52" width="58" height="6" rx="2" fill="#1a0a00" opacity="0.3" />
      <rect x="12" y="62" width="38" height="11" rx="5.5" fill="#ff4d6d" opacity="0.9" />
      <rect x="56" y="62" width="38" height="11" rx="5.5" fill="#ffd60a" opacity="0.85" />
      <rect x="160" y="30" width="108" height="46" rx="16" fill="#ffe4e9" />
      <circle cx="214" cy="53" r="14" fill="#ffb3bf" opacity="0.7" />
      {/* Products */}
      <rect x="12" y="90" width="60" height="7" rx="2" fill="#1a0a00" opacity="0.4" />
      <rect x="12" y="102" width="74" height="68" rx="16" fill="#fff" stroke="#ffd60a" strokeWidth="1.5" />
      <rect x="12" y="102" width="74" height="40" rx="16" fill="#ffe4e9" />
      <rect x="20" y="148" width="38" height="5" rx="1.5" fill="#1a0a00" opacity="0.5" />
      <rect x="20" y="156" width="46" height="8" rx="4" fill="#ff4d6d" opacity="0.85" />
      <rect x="93" y="102" width="74" height="68" rx="16" fill="#fff" stroke="#ff4d6d" strokeWidth="1.5" />
      <rect x="93" y="102" width="74" height="40" rx="16" fill="#fef9c3" />
      <rect x="101" y="148" width="38" height="5" rx="1.5" fill="#1a0a00" opacity="0.5" />
      <rect x="101" y="156" width="46" height="8" rx="4" fill="#ffd60a" opacity="0.85" />
      <rect x="174" y="102" width="74" height="68" rx="16" fill="#fff" stroke="#ffd60a" strokeWidth="1.5" />
      <rect x="174" y="102" width="74" height="40" rx="16" fill="#e8f5e9" />
      <rect x="182" y="148" width="38" height="5" rx="1.5" fill="#1a0a00" opacity="0.5" />
      <rect x="182" y="156" width="46" height="8" rx="4" fill="#ff4d6d" opacity="0.85" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------

interface Props {
  currentTemplateId: string;
  rawSections: string;
  /** Template list fetched from /templates — drives the picker. */
  templates: TemplateMeta[];
}

export default function DesignClient({ currentTemplateId, rawSections, templates }: Props) {
  const [selected, setSelected] = useState(currentTemplateId);
  const [saved, setSaved] = useState(currentTemplateId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sections state — derived from current saved template
  const [sections, setSections] = useState<HomeSection[]>(() => parseSections(rawSections, currentTemplateId));
  const [sectionsSaved, setSectionsSaved] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [isPendingSections, startSections] = useTransition();

  const isDirty = selected !== saved;
  const sectionsDef = SECTION_REGISTRY[selected] ?? SECTION_REGISTRY.soulthread;

  function handleTemplateSelect(templateId: string) {
    setSelected(templateId);
    // Reset sections to the new template's defaults when template changes
    if (templateId !== saved) {
      setSections(parseSections('', templateId));
    } else {
      setSections(parseSections(rawSections, templateId));
    }
    setSectionsSaved(false);
  }

  function handleApply() {
    if (!isDirty) return;
    setError(null);
    startTransition(async () => {
      const result = await setTemplateAction(selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(selected);
    });
  }

  function toggleSection(id: string) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSectionsSaved(false);
  }

  function moveSection(id: string, dir: -1 | 1) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    setSectionsSaved(false);
  }

  function handleSaveSections() {
    setSectionsError(null);
    startSections(async () => {
      const result = await saveSectionsAction(sections);
      if (result.error) {
        setSectionsError(result.error);
        return;
      }
      setSectionsSaved(true);
    });
  }

  return (
    <div className="space-y-8">
      {/* Template cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        {templates.map((t) => {
          const isActive = saved === t.id;
          const isChosen = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTemplateSelect(t.id)}
              className={`text-left rounded-2xl border-2 transition-all overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3a]/40 ${
                isChosen
                  ? 'border-[#c96a3a] shadow-md'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Preview */}
              <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
                {TEMPLATE_PREVIEWS[t.id] ?? (
                  /* Fallback for templates with no registered SVG preview */
                  <div className="w-full h-full flex items-end p-3 gap-2" style={{ backgroundColor: t.palette[0] }}>
                    {t.palette.map((c, i) => (
                      <span key={i} className="w-6 h-6 rounded-full border border-white/40 flex-shrink-0" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
                {isActive && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
                {isChosen && !isActive && (
                  <span className="absolute top-2 right-2 bg-[#c96a3a] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-white">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="font-semibold text-stone-900">{t.name}</p>
                    <p className="text-xs text-stone-400">{t.tagline}</p>
                  </div>
                  {/* Selection indicator */}
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                    isChosen ? 'border-[#c96a3a] bg-[#c96a3a]' : 'border-stone-300'
                  }`}>
                    {isChosen && (
                      <svg viewBox="0 0 16 16" fill="white" className="w-full h-full p-0.5">
                        <path d="M13.5 4.5l-7 7L3 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mb-3">{t.description}</p>

                {/* Palette swatches */}
                <div className="flex items-center gap-1.5">
                  {t.palette.map((color, i) => (
                    <span
                      key={i}
                      title={t.paletteLabels[i]}
                      style={{ backgroundColor: color }}
                      className="w-4 h-4 rounded-full border border-stone-200 flex-shrink-0"
                    />
                  ))}
                  <span className="text-[10px] text-stone-400 ml-1">Colour palette</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Apply button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleApply}
          disabled={!isDirty || isPending}
          className="px-6 py-2.5 rounded-xl bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Applying…' : 'Apply template'}
        </button>
        {!isDirty && saved === currentTemplateId && (
          <p className="text-sm text-stone-400">Select a different template to apply.</p>
        )}
        {isDirty && (
          <p className="text-sm text-stone-500">
            Switching from <span className="font-medium">{templates.find(t => t.id === saved)?.name}</span> to <span className="font-medium">{templates.find(t => t.id === selected)?.name}</span>
          </p>
        )}
        {!isDirty && saved !== currentTemplateId && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Template updated
          </span>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <p className="text-xs text-stone-400">
        Changes apply immediately to your live storefront. Your products, orders, and settings are unaffected.
      </p>

      {/* ── Sections editor ── */}
      <div className="border-t border-stone-100 pt-8">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-stone-900">Homepage sections</h2>
          <p className="text-xs text-stone-400 mt-0.5">Toggle sections on or off, and drag to reorder how they appear.</p>
        </div>

        <div className="space-y-2">
          {sections.map((section, idx) => {
            const def = sectionsDef.find((d) => d.id === section.id);
            if (!def) return null;
            return (
              <div
                key={section.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  section.enabled ? 'bg-stone-50 border border-stone-100' : 'bg-white border border-stone-100 opacity-50'
                }`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, -1)}
                    disabled={idx === 0}
                    className="p-0.5 rounded text-stone-300 hover:text-stone-600 disabled:opacity-0 transition-colors"
                    title="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, 1)}
                    disabled={idx === sections.length - 1}
                    className="p-0.5 rounded text-stone-300 hover:text-stone-600 disabled:opacity-0 transition-colors"
                    title="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                </div>

                {/* Drag handle visual */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-stone-300 flex-shrink-0">
                  <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
                </svg>

                {/* Section info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{def.label}</p>
                  <p className="text-xs text-stone-400 truncate">{def.description}</p>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={section.enabled}
                  onClick={() => toggleSection(section.id)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3a]/40 ${
                    section.enabled ? 'bg-[#c96a3a]' : 'bg-stone-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      section.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Save sections button */}
        <div className="flex items-center gap-4 mt-5">
          <button
            type="button"
            onClick={handleSaveSections}
            disabled={isPendingSections}
            className="px-5 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPendingSections ? 'Saving…' : 'Save sections'}
          </button>
          {sectionsSaved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Saved
            </span>
          )}
          {sectionsError && <p className="text-sm text-red-600">{sectionsError}</p>}
        </div>
      </div>
    </div>
  );
}
