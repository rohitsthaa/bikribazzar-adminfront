'use client';

import { useState, useTransition } from 'react';
import type { Review } from '@/lib/api';
import { updateReviewStatusAction } from './actions';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={n <= value ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          className={n <= value ? 'text-amber-400' : 'text-stone-200'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-500 border border-red-200',
};

export default function ReviewsClient({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<Filter>('pending');
  const [, startTransition] = useTransition();

  function handleStatus(id: number, status: 'approved' | 'rejected' | 'pending') {
    startTransition(async () => {
      try {
        const updated = await updateReviewStatusAction(id, status);
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)));
      } catch {
        alert('Failed to update review status.');
      }
    });
  }

  const visible = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);
  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {f} <span className="ml-1 text-xs text-stone-400">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-400">
          No {filter === 'all' ? '' : filter} reviews.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="font-medium text-stone-900">{r.reviewerName}</span>
                    <Stars value={r.rating} />
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mb-2">
                    {r.productId} · {new Date(r.createdAt).toLocaleDateString('en-NP', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  {r.body && (
                    <p className="text-sm text-stone-600 leading-relaxed">{r.body}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => handleStatus(r.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatus(r.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                    >
                      Reject
                    </button>
                  )}
                  {r.status !== 'pending' && (
                    <button
                      onClick={() => handleStatus(r.id, 'pending')}
                      className="px-3 py-1.5 rounded-lg bg-stone-50 text-stone-500 text-xs font-medium hover:bg-stone-100 transition-colors border border-stone-200"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
