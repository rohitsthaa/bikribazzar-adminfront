import type { ReactNode } from 'react';

/**
 * Shared icon + headline + body empty state, extracted from the pattern
 * built for the Gallery page. Several list pages (Orders, Customers,
 * Coupons, Testimonials, Dashboard's recent-orders panel) previously used a
 * single line of gray text ("No customers yet.") for this — fine for a
 * small inline note, but thin as the entire content of a page's main list.
 * Use this for a page/section's primary empty state; a bare `<p>` is still
 * fine for small secondary notices (e.g. "No delivery address yet." inside
 * an order's address card).
 */
export default function EmptyState({
  icon,
  title,
  body,
  className = '',
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-stone-200 rounded-2xl ${className}`}>
      <span className="w-11 h-11 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
        {icon}
      </span>
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {body && <p className="text-xs text-stone-400 mt-1 max-w-xs">{body}</p>}
    </div>
  );
}
