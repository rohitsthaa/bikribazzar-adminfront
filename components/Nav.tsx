import Link from 'next/link';
import { logout } from '@/app/login/actions';

const links = [
  { href: '/orders', label: 'Orders' },
  { href: '/products', label: 'Products' },
  { href: '/materials', label: 'Materials' },
  { href: '/gallery', label: 'Gallery' },
];

export default function Nav() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm tracking-tight">Soul Thread Admin</span>
          <div className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
