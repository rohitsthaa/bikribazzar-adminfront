'use client';
import Link from 'next/link';
import { useEffect, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/login/actions';
import { BikriMark } from '@/components/BikriMark';

// ─── Icons ────────────────────────────────────────────────────────────────────

const I = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  Dashboard:    () => I('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'),
  Stores:       () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Orders:       () => I('M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0'),
  Customers:    () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Delivery:     () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Coupons:      () => I('M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01M12 2l9 9'),
  Finance:      () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  Products:     () => I('M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01'),
  Categories:   () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Gallery:      () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Content:      () => I('M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H9H8'),
  Design:       () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  Testimonials: () => I('M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'),
  Reviews:      () => I('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'),
  Enquiries:    () => I('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z'),
  Team:         () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"/>
    </svg>
  ),
  Users:        () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Plans:        () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="10" y2="15"/>
    </svg>
  ),
  Blog:         () => I('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'),
  Portfolio:    () => I('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'),
  Services:     () => I('M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2'),
  Settings:     () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  SignOut:      () => I('M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'),
  ExternalLink: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  ChevronLeft:  () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ─── Nav data ─────────────────────────────────────────────────────────────────

const STORE_NAV_GROUPS = [
  [
    { href: '/dashboard',    label: 'Dashboard',    Icon: Icons.Dashboard },
    { href: '/orders',       label: 'Orders',       Icon: Icons.Orders },
    { href: '/enquiries',    label: 'Enquiries',    Icon: Icons.Enquiries },
    { href: '/customers',    label: 'Customers',    Icon: Icons.Customers },
    { href: '/delivery',     label: 'Delivery',     Icon: Icons.Delivery },
    { href: '/coupons',      label: 'Coupons',      Icon: Icons.Coupons },
    { href: '/finance',      label: 'Finance',      Icon: Icons.Finance },
  ],
  [
    { href: '/products',     label: 'Products',     Icon: Icons.Products },
    { href: '/categories',   label: 'Categories',   Icon: Icons.Categories },
    { href: '/gallery',      label: 'Gallery',      Icon: Icons.Gallery },
    { href: '/content',      label: 'Content',      Icon: Icons.Content },
    { href: '/blog',         label: 'Blog',         Icon: Icons.Blog },
    { href: '/portfolio',    label: 'Portfolio',    Icon: Icons.Portfolio },
    { href: '/services',     label: 'Services',     Icon: Icons.Services },
  ],
  [
    { href: '/design',         label: 'Design',       Icon: Icons.Design },
    { href: '/testimonials',   label: 'Testimonials', Icon: Icons.Testimonials },
    { href: '/reviews',        label: 'Reviews',      Icon: Icons.Reviews },
    { href: '/settings/team',  label: 'Team',         Icon: Icons.Team },
    { href: '/settings',       label: 'Settings',     Icon: Icons.Settings },
    { href: '/billing',        label: 'Billing',      Icon: Icons.Plans },
  ],
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StoreNavItem({ href, label, Icon, active }: {
  href: string; label: string; Icon: () => JSX.Element; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[#c96a3a]/10 text-[#c96a3a]'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#c96a3a]" />
      )}
      <span className={`flex-shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`}>
        <Icon />
      </span>
      {label}
    </Link>
  );
}

function PlatformNavItem({ href, label, Icon, active }: {
  href: string; label: string; Icon: () => JSX.Element; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-indigo-500/[0.18] text-indigo-300'
          : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-indigo-400" />
      )}
      <span className={`flex-shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`}>
        <Icon />
      </span>
      {label}
    </Link>
  );
}

function UserChip({ email, dark }: { email: string; dark?: boolean }) {
  // 'legacy-admin' was the synthetic identity returned for the shared
  // ADMIN_PASSWORD cookie, removed 2026-07-06 — every real admin now has a
  // real email, but the fallback display stays as a harmless safety net.
  const initial = email !== 'legacy-admin' ? email[0].toUpperCase() : '?';
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl">
      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        dark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-stone-200 text-stone-600'
      }`}>
        {initial}
      </span>
      <span className={`text-xs truncate min-w-0 ${dark ? 'text-slate-400' : 'text-stone-500'}`}>
        {email === 'legacy-admin' ? 'Legacy admin' : email}
      </span>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar({
  isSuper = false,
  canSettings = true,
  allowedTabs = null,
  storeName,
  storeUrl,
  adminEmail,
  siteType,
}: {
  isSuper?: boolean;
  canSettings?: boolean;
  // Per-admin tab restriction (see lib/tabs.ts) set by a store/super admin when adding a
  // staff member. null = unrestricted (every tab canSettings/role already permits).
  allowedTabs?: string[] | null;
  storeName?: string;
  storeUrl?: string | null;
  adminEmail?: string;
  // Store.siteType — Portfolio/Services nav items only make sense (and only
  // show) for stores actually on that site type; every other store hides them.
  siteType?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPlatformMode = isSuper && pathname.startsWith('/platform');

  // Auto-close sidebar when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Shared slide-in transition classes
  const panelBase = `fixed inset-y-0 left-0 w-64 z-40 flex flex-col transition-transform duration-300 ease-out ${
    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
  }`;

  // ── Platform mode ── dark slate sidebar ─────────────────────────────────────
  if (isPlatformMode) {
    return (
      <>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="fixed top-3 left-3 z-30 md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#0f172a] border border-white/10 text-slate-400 shadow-sm"
        >
          <Icons.Menu />
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside className={`${panelBase} bg-[#0f172a]`}>
          {/* Brand */}
          <Link href="/platform" className="group flex items-center gap-3 px-5 pt-7 pb-6">
            <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <BikriMark bg="#0f172a" size={36} />
            </span>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold tracking-tight leading-snug">
                Bikri<span className="text-[#F5845A]">Bazaar</span>
              </p>
              <p className="text-slate-500 text-[11px] leading-tight font-medium tracking-wide uppercase">
                Platform Console
              </p>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Icons.X />
          </button>

          <div className="mx-5 border-t border-white/[0.07]" />

          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            <PlatformNavItem
              href="/platform"
              label="Overview"
              Icon={Icons.Dashboard}
              active={pathname === '/platform'}
            />
            <PlatformNavItem
              href="/platform/stores"
              label="Stores"
              Icon={Icons.Stores}
              active={
                pathname === '/platform/stores' ||
                pathname.startsWith('/platform/stores/') ||
                (pathname.startsWith('/platform/') &&
                 !pathname.startsWith('/platform/stores') &&
                 !pathname.startsWith('/platform/templates') &&
                 !pathname.startsWith('/platform/users') &&
                 !pathname.startsWith('/platform/plans') &&
                 pathname !== '/platform')
              }
            />
            <PlatformNavItem
              href="/platform/templates"
              label="Templates"
              Icon={Icons.Design}
              active={pathname === '/platform/templates' || pathname.startsWith('/platform/templates/')}
            />
            <PlatformNavItem
              href="/platform/plans"
              label="Plans"
              Icon={Icons.Plans}
              active={pathname === '/platform/plans' || pathname.startsWith('/platform/plans/')}
            />
            <PlatformNavItem
              href="/platform/users"
              label="Users"
              Icon={Icons.Users}
              active={pathname === '/platform/users' || pathname.startsWith('/platform/users/')}
            />
          </nav>

          <div className="mx-5 border-t border-white/[0.07]" />

          <div className="px-3 py-4 space-y-1">
            {adminEmail && <UserChip email={adminEmail} dark />}
            <form action={logout}>
              <button
                type="submit"
                className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-all duration-150 text-left"
              >
                <span className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">
                  <Icons.SignOut />
                </span>
                Sign out
              </button>
            </form>
          </div>
        </aside>
      </>
    );
  }

  // ── Store mode ── white sidebar ──────────────────────────────────────────────
  const initials = storeName
    ? storeName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed top-3 left-3 z-30 md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-stone-200 text-stone-500 shadow-sm"
      >
        <Icons.Menu />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`${panelBase} bg-white border-r border-stone-200`}>
        {/* Brand */}
        <div className="px-4 pt-5 pb-4">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#c96a3a] text-white text-sm font-bold tracking-tight flex-shrink-0 shadow-sm transition-transform duration-150 group-hover:scale-105">
              {initials || 'ST'}
            </span>
            <div className="min-w-0">
              <p className="text-stone-900 text-sm font-semibold tracking-tight leading-snug truncate">
                {storeName ?? 'Store admin'}
              </p>
              <p className="text-stone-400 text-[11px] leading-tight">Store admin</p>
            </div>
          </Link>

          {isSuper && (
            <Link
              href="/platform"
              className="group mt-3 flex items-center gap-1.5 text-[11px] font-medium text-stone-400 hover:text-[#c96a3a] transition-colors duration-150"
            >
              <span className="transition-transform duration-150 group-hover:-translate-x-0.5">
                <Icons.ChevronLeft />
              </span>
              Back to Platform
            </Link>
          )}
        </div>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <Icons.X />
        </button>

        <div className="mx-4 border-t border-stone-100" />

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {STORE_NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="my-2 mx-1 border-t border-stone-100" />}
              {group.map((item) => {
                if ((item.href === '/settings' || item.href === '/settings/team' || item.href === '/billing') && !canSettings) return null;
                if (item.href === '/portfolio' && siteType !== 'portfolio') return null;
                if (item.href === '/services' && siteType !== 'business') return null;
                // Per-admin tab restriction, set when this staff account was added/edited on
                // the Team page. Dashboard and the three settings-gated items above are never
                // subject to it — Dashboard is always the landing page, and Settings/Team/
                // Billing are already hard-gated by role via canSettings just above.
                if (
                  allowedTabs &&
                  item.href !== '/dashboard' &&
                  item.href !== '/settings' &&
                  item.href !== '/settings/team' &&
                  item.href !== '/billing' &&
                  !allowedTabs.includes(item.href.slice(1))
                ) return null;
                // For /settings, don't match /settings/team as active (it has its own nav item)
                const active = item.href === '/settings'
                  ? pathname === '/settings'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <StoreNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    Icon={item.Icon}
                    active={active}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mx-4 border-t border-stone-100" />

        <div className="px-3 py-3 space-y-0.5">
          {storeUrl && (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-all duration-150"
            >
              <span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110">
                <Icons.ExternalLink />
              </span>
              View store
            </a>
          )}
          {adminEmail && <UserChip email={adminEmail} />}
          <form action={logout}>
            <button
              type="submit"
              className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all duration-150 text-left"
            >
              <span className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">
                <Icons.SignOut />
              </span>
              Sign out
            </button>
          </form>
        </div>

        {/* Powered by BikriBazaar */}
        <a
          href="https://bikribazaar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-3 border-t border-stone-100 text-[10px] text-stone-300 hover:text-stone-500 transition-colors duration-150"
        >
          <BikriMark bg="white" size={16} />
          <span>Powered by <strong className="font-semibold text-stone-400">BikriBazaar</strong></span>
        </a>
      </aside>
    </>
  );
}
