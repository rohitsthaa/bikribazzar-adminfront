import Link from 'next/link';

/**
 * Section nav for a single store's management page.
 *
 * The page carried seven stacked SectionCards and five independent save buttons — identity,
 * theme, payment secrets, courier config, template access, billing and team, all in one
 * scroll. Nothing indicated which Save wrote which section, and editing courier settings meant
 * scrolling past a store's payment secrets to reach it.
 *
 * Tab lives in the URL rather than component state so this stays a server component (every
 * panel is server-rendered data), and so a link to a specific store's billing can be shared.
 */
export const STORE_TABS = [
  { key: 'general',  label: 'General' },
  { key: 'design',   label: 'Design' },
  { key: 'payments', label: 'Payments' },
  { key: 'courier',  label: 'Courier' },
  { key: 'billing',  label: 'Billing' },
  { key: 'team',     label: 'Team' },
] as const;

export type StoreTab = typeof STORE_TABS[number]['key'];

export function resolveTab(value: string | undefined): StoreTab {
  return STORE_TABS.some((t) => t.key === value) ? (value as StoreTab) : 'general';
}

export default function StoreTabs({ storeId, active }: { storeId: string; active: StoreTab }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-stone-200" aria-label="Store sections">
      {STORE_TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            // 'general' is the default, so it stays on the clean URL.
            href={t.key === 'general' ? `/platform/${storeId}` : `/platform/${storeId}?tab=${t.key}`}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-stone-800 text-stone-900'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
