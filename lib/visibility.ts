/**
 * One "Visibility" choice in the admin, stored as two API fields.
 *
 * `available` and `status` are separate columns, and until 2026-10-22 the admin showed them
 * as two unrelated controls while the storefront only read `available` — so a product set to
 * "Draft — still being set up" but left Available was on sale. The API now shows a product
 * only when it is Available AND active; this file is the admin's half of that rule.
 */
export type Visibility = 'live' | 'hidden' | 'draft' | 'archived';
type Status = 'draft' | 'active' | 'archived';

export const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: 'live',     label: 'Live',     hint: 'On sale in your shop.' },
  { value: 'hidden',   label: 'Hidden',   hint: 'Not shown to customers. Ready to switch on any time.' },
  { value: 'draft',    label: 'Draft',    hint: 'Still being set up. Not shown to customers.' },
  { value: 'archived', label: 'Archived', hint: 'No longer sold. Kept for order history.' },
];

export function visibilityOf(p: { available: boolean; status?: Status | null }): Visibility {
  if (p.status === 'draft') return 'draft';
  if (p.status === 'archived') return 'archived';
  return p.available ? 'live' : 'hidden';
}

export function fieldsForVisibility(v: Visibility): { available: boolean; status: Status } {
  switch (v) {
    case 'live':     return { available: true,  status: 'active' };
    case 'hidden':   return { available: false, status: 'active' };
    case 'draft':    return { available: false, status: 'draft' };
    case 'archived': return { available: false, status: 'archived' };
  }
}
