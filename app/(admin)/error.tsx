'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error boundary for every admin route. Before this there were only two, on /orders and
 * /products, so a failed fetch anywhere else fell through to Next's default — which in a
 * production build is a blank screen reading "Application error", with no way back and
 * nothing to tell support.
 *
 * `reset()` re-runs the failed render, which is genuinely useful here: most failures in this
 * app are a transient API hiccup rather than a broken page.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Sentry's Next.js integration picks this up; the log keeps it visible in local dev too.
    console.error('[admin] route error:', error);
  }, [error]);

  return (
    <main className="p-6 md:p-8 max-w-xl">
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-stone-900">Something went wrong</h1>
        <p className="mt-1.5 text-sm text-stone-500">
          This page couldn&apos;t load. It&apos;s usually a temporary connection problem — trying
          again often works.
        </p>

        {/* Production builds replace the message with a digest, so show whichever exists.
            Without it a support conversation starts with nothing to go on. */}
        {(error.digest || error.message) && (
          <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 font-mono text-[11px] text-stone-500 break-all">
            {error.digest ? `Reference: ${error.digest}` : error.message}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={reset}
            className="rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
