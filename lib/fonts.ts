/**
 * Fonts a store can pick on the Design page (saved to store.theme.fonts). The storefront loads
 * any Google Fonts family by name (templates/theme.ts `storeFontFamilies`), so this list is
 * only a curated menu — Platform → store can still type any family name.
 */
export type FontChoice = { family: string; kind: 'serif' | 'sans' | 'display' | 'script' };

export const FONT_CHOICES: FontChoice[] = [
  { family: 'Inter', kind: 'sans' },
  { family: 'Poppins', kind: 'sans' },
  { family: 'Manrope', kind: 'sans' },
  { family: 'DM Sans', kind: 'sans' },
  { family: 'Work Sans', kind: 'sans' },
  { family: 'Nunito', kind: 'sans' },
  { family: 'Lato', kind: 'sans' },
  { family: 'Mukta', kind: 'sans' },
  { family: 'Cormorant Garamond', kind: 'serif' },
  { family: 'Playfair Display', kind: 'serif' },
  { family: 'Lora', kind: 'serif' },
  { family: 'Libre Baskerville', kind: 'serif' },
  { family: 'Fraunces', kind: 'serif' },
  { family: 'DM Serif Display', kind: 'display' },
  { family: 'Space Grotesk', kind: 'display' },
  { family: 'Syne', kind: 'display' },
  { family: 'Dancing Script', kind: 'script' },
];

/** Same rule as the storefront: a bare family name is loaded from Google Fonts. */
export function isFontFamilyName(v: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9 ]{0,60}$/.test(v);
}

/** First family in a CSS font stack, unquoted: "'Inter', system-ui" → "Inter". */
export function firstFamily(stack: string | undefined): string {
  return (stack ?? '').split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

/** Google Fonts stylesheet for previewing the given families in the admin. */
export function googleFontsHref(families: string[]): string {
  const names = [...new Set(families.filter(isFontFamilyName))];
  if (names.length === 0) return '';
  return `https://fonts.googleapis.com/css2?${names.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;600`).join('&')}&display=swap`;
}
