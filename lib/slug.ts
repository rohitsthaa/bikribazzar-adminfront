// Shared slug generator — turns a product name into a URL-safe id.
//
// Used to auto-fill the "ID (URL slug)" field on the Add-product form as the
// merchant types a name, and to fall back to when a CSV import row doesn't
// supply its own id column. Always returns a non-empty string: if the name
// has no latin letters/digits (e.g. Devanagari text, emoji, punctuation-only),
// falls back to a short time-based suffix rather than returning "" — a blank
// id becomes a product's primary key, which breaks Edit/Delete/routing for
// that product with no error shown anywhere (see the 2026-08-02 incident:
// "Heera Single Macrame..." ended up with an empty id and its Edit button
// silently did nothing).
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `product-${Date.now().toString(36)}`;
}
