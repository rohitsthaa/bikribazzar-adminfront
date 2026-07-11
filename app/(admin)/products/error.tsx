'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ProductsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="p-6 md:p-8 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-3">
        <h1 className="text-lg font-semibold text-gray-900">Couldn't load products</h1>
        <p className="text-sm text-gray-500">Something went wrong fetching this page. Try again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
