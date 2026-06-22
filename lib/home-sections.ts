/**
 * Home-page section config — admin-side copy (kept in sync with the storefront's
 * lib/home-sections.ts). Defines which sections each template supports so the
 * admin can show the right list without importing from the storefront.
 */

export type HomeSection = { id: string; enabled: boolean };

export const SECTION_REGISTRY: Record<string, Array<{ id: string; label: string; description: string }>> = {
  soulthread: [
    { id: 'hero',         label: 'Hero',          description: 'Brand header with tagline and main image' },
    { id: 'collection',   label: 'Collection',    description: 'Featured products grid' },
    { id: 'marquee',      label: 'Marquee strip',  description: 'Scrolling accent banner' },
    { id: 'story',        label: 'Our story',      description: 'Brand story and handcraft values' },
    { id: 'testimonials', label: 'Testimonials',   description: 'Customer reviews carousel' },
    { id: 'gallery',      label: 'Gallery strip',  description: 'Photo gallery row' },
    { id: 'cta',          label: 'Call to action', description: 'WhatsApp / contact CTA' },
  ],
  aurora: [
    { id: 'hero',         label: 'Hero',          description: 'Full-width header with headline' },
    { id: 'collection',   label: 'Collection',    description: 'Product grid' },
    { id: 'testimonials', label: 'Testimonials',  description: 'Customer quotes' },
    { id: 'cta',          label: 'Call to action', description: 'Contact / enquiry strip' },
  ],
};

export function parseSections(raw: string, templateId: string): HomeSection[] {
  const defs = SECTION_REGISTRY[templateId] ?? SECTION_REGISTRY.soulthread;
  let stored: HomeSection[] = [];
  try { if (raw) stored = JSON.parse(raw) as HomeSection[]; } catch { /* ignore */ }
  if (stored.length === 0) return defs.map((s) => ({ id: s.id, enabled: true }));

  const storedIds = new Set(stored.map((s) => s.id));
  const knownIds  = new Set(defs.map((s) => s.id));
  const merged    = stored.filter((s) => knownIds.has(s.id));
  for (const def of defs) {
    if (!storedIds.has(def.id)) merged.push({ id: def.id, enabled: true });
  }
  return merged;
}
