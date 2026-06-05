'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/login/actions';

const links = [
  { href: '/orders', label: 'Orders' },
  { href: '/products', label: 'Products' },
  { href: '/gallery', label: 'Gallery' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-stone-200 px-4 md:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-7 h-7 bg-stone-800 text-white text-xs font-bold rounded-md tracking-tight">
              ST
            </span>
            <span className="font-semibold text-sm tracking-tight text-stone-900 hidden sm:block">
              Soul Thread
            </span>
          </Link>
          <div className="flex gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-stone-100 text-stone-900'
                      : 'text-gray-500 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-stone-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
