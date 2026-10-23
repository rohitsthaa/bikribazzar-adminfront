/**
 * Home-page section config (`home_sections` setting: [{ id, enabled }], in display order).
 *
 * The list of sections each template has comes from the API (TemplateMeta.homeSections),
 * which the storefront publishes from its templates/<id>/manifest.ts on every deploy. Until
 * 2026-10-23 the admin kept its own copy here, which had drifted from the storefront twice.
 * parseSections below is the same merge the storefront does (lib/home-sections.ts there).
 */
import type { TemplateHomeSection, TemplateMeta } from './api';

export type HomeSection = { id: string; enabled: boolean };

type SectionSource = Pick<TemplateMeta, 'homeSections' | 'homeSectionRenames'> | null | undefined;

/** The template's sections, in default order ([] if the template isn't known). */
export function sectionDefs(template: SectionSource): TemplateHomeSection[] {
  return template?.homeSections ?? [];
}

/**
 * The store's saved section order/visibility, resolved against the template: follows renames,
 * drops sections the template no longer has, appends new ones switched on.
 */
export function parseSections(raw: string, template: SectionSource): HomeSection[] {
  const defs = sectionDefs(template);
  const renames = template?.homeSectionRenames ?? {};
  let stored: HomeSection[] = [];
  try { if (raw) stored = JSON.parse(raw) as HomeSection[]; } catch { /* ignore */ }
  if (!Array.isArray(stored) || stored.length === 0) return defs.map((s) => ({ id: s.id, enabled: true }));

  const knownIds = new Set(defs.map((s) => s.id));
  const merged: HomeSection[] = [];
  for (const s of stored) {
    const id = renames[s.id] ?? s.id;
    if (knownIds.has(id) && !merged.some((m) => m.id === id)) merged.push({ id, enabled: s.enabled !== false });
  }
  for (const def of defs) {
    if (!merged.some((m) => m.id === def.id)) merged.push({ id: def.id, enabled: true });
  }
  return merged;
}
