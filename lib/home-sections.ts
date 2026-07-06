/**
 * Home-page section config — admin-side copy (kept in sync with the storefront's
 * lib/home-sections.ts). Defines which sections each template supports so the
 * admin can show the right list without importing from the storefront.
 *
 * Corrected 2026-07-07: this file had drifted from the storefront's real section
 * ids for neon/bubbly/bloom/coastal (invented separate "marquee"/"values" toggle
 * entries that don't exist as their own section in those templates' actual
 * sectionMap — toggling them in the admin did nothing), and was missing entries
 * entirely for artisan/folio/profile/capsule (falling back to soulthread's list,
 * which doesn't match any of those four templates' real sections either). Now
 * matches each template's actual `sectionMap` keys exactly — see each
 * `templates/<id>/Home.tsx` in soulthreadktm for the source of truth.
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
    { id: 'collection',   label: 'Collection',    description: 'Value strip + product grid' },
    { id: 'testimonials', label: 'Testimonials',  description: 'Customer quotes' },
    { id: 'cta',          label: 'Call to action', description: 'Contact / enquiry strip' },
  ],
  bloom: [
    { id: 'hero',         label: 'Hero',          description: 'Brand header with botanical feel' },
    { id: 'collection',   label: 'Collection',    description: 'Featured products grid' },
    { id: 'testimonials', label: 'Testimonials',   description: 'Customer reviews' },
    { id: 'cta',          label: 'Call to action', description: 'WhatsApp / contact CTA' },
  ],
  coastal: [
    { id: 'hero',         label: 'Hero',          description: 'Bold ocean-blue hero section' },
    { id: 'collection',   label: 'Collection',    description: 'Featured products grid' },
    { id: 'testimonials', label: 'Testimonials',   description: 'Customer reviews' },
    { id: 'cta',          label: 'Call to action', description: 'WhatsApp / contact CTA' },
  ],
  neon: [
    { id: 'hero',         label: 'Hero',          description: 'Dark electric hero with glow effect' },
    { id: 'collection',   label: 'Collection',    description: 'Marquee strip + product grid on dark background' },
    { id: 'testimonials', label: 'Testimonials',   description: 'Customer quotes' },
    { id: 'cta',          label: 'Call to action', description: 'Contact CTA' },
  ],
  bubbly: [
    { id: 'hero',         label: 'Hero',          description: 'Colourful hero with blob accents' },
    { id: 'collection',   label: 'Collection',    description: 'Value strip + rounded product grid' },
    { id: 'testimonials', label: 'Testimonials',   description: 'Colourful testimonial cards' },
    { id: 'cta',          label: 'Call to action', description: 'Bold CTA block' },
  ],
  folio: [
    { id: 'hero',         label: 'Hero',           description: 'Typographic hero with tagline' },
    { id: 'works',        label: 'Selected works', description: 'Gallery images grid' },
    { id: 'shop',         label: 'Prints & editions', description: 'Featured products with buy links' },
    { id: 'testimonials', label: 'Testimonials',   description: 'Client quote' },
    { id: 'cta',          label: 'Commission CTA', description: 'Get in touch strip' },
  ],
  profile: [
    { id: 'hero',         label: 'Hero',          description: 'Navy hero with headline and product image' },
    { id: 'services',     label: 'Services',      description: 'Featured services / products grid' },
    { id: 'testimonials', label: 'Testimonials',  description: 'Client testimonials' },
    { id: 'cta',          label: 'Call to action', description: 'Get started CTA strip' },
  ],
  artisan: [
    { id: 'hero',         label: 'Hero',          description: 'Warm golden hero with headline and product image' },
    { id: 'collection',   label: 'Collection',    description: 'Featured products grid' },
    { id: 'testimonials', label: 'Testimonials',  description: 'Customer quotes' },
    { id: 'cta',          label: 'Call to action', description: 'Contact / enquiry strip' },
  ],
  capsule: [
    { id: 'hero',         label: 'Hero',          description: 'Editorial hero with polaroid-style product photos' },
    { id: 'collection',   label: 'Collection',    description: 'Marquee ticker + "The Edit" product grid' },
    { id: 'testimonials', label: 'Testimonials',  description: 'Pull-quote customer reviews' },
    { id: 'cta',          label: 'Call to action', description: 'Custom orders CTA strip' },
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
