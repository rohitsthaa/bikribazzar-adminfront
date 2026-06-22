import { getReviews } from '@/lib/api';
import ReviewsClient from './ReviewsClient';

export const metadata = { title: 'Reviews — Admin' };

export default async function ReviewsPage() {
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  try {
    reviews = await getReviews('all');
  } catch {
    // API unavailable or migration not yet run — show empty state
  }

  const pending = reviews.filter((r) => r.status === 'pending').length;

  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Reviews</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {pending > 0
            ? `${pending} pending review${pending !== 1 ? 's' : ''} awaiting moderation`
            : 'All reviews moderated'}
        </p>
      </div>
      <ReviewsClient reviews={reviews} />
    </main>
  );
}
