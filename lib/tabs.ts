// Canonical list of store-admin sidebar tabs an admin can grant/withhold from a staff
// account, one entry per togglable `href` in components/Sidebar.tsx's STORE_NAV_GROUPS.
// Key = href with the leading slash stripped, so Sidebar can filter with a plain
// `allowedTabs.includes(key)` check against the same strings used here.
//
// Deliberately excluded (never togglable):
// - `dashboard` — always visible; a staff account needs a landing page after login.
// - `settings`, `settings/team`, `billing` — hard-gated by role via lib/auth.ts's can()
//   (pricing/payment config, team management, billing are store-admin/super only). Tab
//   toggles are a *restriction* within what the role already permits, never a way to grant
//   a staff account access beyond its role ceiling.
export type TabKey =
  | 'orders'
  | 'enquiries'
  | 'customers'
  | 'delivery'
  | 'coupons'
  | 'products'
  | 'gallery'
  | 'content'
  | 'blog'
  | 'portfolio'
  | 'services'
  | 'design'
  | 'testimonials'
  | 'reviews';

export const STAFF_TOGGLE_TABS: { key: TabKey; label: string }[] = [
  { key: 'orders', label: 'Orders' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'customers', label: 'Customers' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'products', label: 'Products' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'content', label: 'Content' },
  { key: 'blog', label: 'Blog' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'services', label: 'Services' },
  { key: 'design', label: 'Design' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'reviews', label: 'Reviews' },
];

const ALL_TAB_KEYS = STAFF_TOGGLE_TABS.map((t) => t.key);

/** `"orders,products"` (API/DB form) → `['orders', 'products']`. Blank/null → null (unrestricted). */
export function parseAllowedTabs(raw: string | null | undefined): string[] | null {
  if (!raw || !raw.trim()) return null;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** `['orders', 'products']` → `"orders,products"`. Empty/null → `''` (the API's clear sentinel). */
export function serializeAllowedTabs(tabs: string[] | null): string {
  if (!tabs || tabs.length === 0) return '';
  return tabs.join(',');
}

/** True if every key in `tabs` is a real, still-existing tab. Guards against stale saved keys. */
export function isKnownTab(key: string): key is TabKey {
  return (ALL_TAB_KEYS as string[]).includes(key);
}
