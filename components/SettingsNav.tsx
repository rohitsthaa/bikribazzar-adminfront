'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Sub-navigation across the Settings pages. */
const TABS = [
  { href: '/settings',          label: 'Store profile', hint: 'Contact, branding, currency' },
  { href: '/settings/payments', label: 'Payments',      hint: 'QR and online gateways' },
  { href: '/settings/courier',  label: 'Courier',       hint: 'NCM shipping setup' },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 border-b border-stone-200" aria-label="Settings sections">
      {TABS.map((t) => {
        // Exact match: /settings must not light up while on /settings/payments.
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            title={t.hint}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              active
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
