import Link from 'next/link';

/**
 * Page links for a server-paginated list. Renders nothing on a single page, so a small store
 * never sees controls it doesn't need.
 *
 * Deliberately links rather than buttons: the page lives in the URL, so a shopkeeper can
 * bookmark page 3 of "new orders", the back button works, and the server component re-runs
 * with the new query instead of the client holding a second copy of the list.
 */
export default function Pager({
  page, limit, total, basePath, params = {},
}: {
  page: number;
  limit: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const lastPage = Math.max(1, Math.ceil(total / limit));
  if (lastPage <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const link = 'px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300';
  const muted = 'px-3 py-1.5 rounded-lg border border-stone-100 text-stone-300 cursor-not-allowed';

  return (
    <nav className="mt-5 flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <p className="text-xs text-stone-400">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1.5">
        {page > 1
          ? <Link href={href(page - 1)} className={link} rel="prev">Previous</Link>
          : <span className={muted} aria-disabled="true">Previous</span>}
        <span className="px-2 text-xs text-stone-400">Page {page} of {lastPage}</span>
        {page < lastPage
          ? <Link href={href(page + 1)} className={link} rel="next">Next</Link>
          : <span className={muted} aria-disabled="true">Next</span>}
      </div>
    </nav>
  );
}
