import { getReviews, getProducts } from '@/lib/api';
import ReviewsClient from './ReviewsClient';

export const metadata = { title: 'Reviews — Admin' };

export default async function ReviewsPage() {
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  try {
    reviews = await getReviews('all');
  } catch {
    // API unavailable or migration not yet run — show empty state
  }

  // Reviews only store the product's slug (productId) — look up display
  // names so the list shows "Single-Tier Hanging Shelf" instead of
  // "single-tier-hanging-shelf" to a non-technical reader.
  const productNames: Record<string, string> = {};
  try {
    const products = await getProducts();
    for (const p of products) productNames[p.id] = p.name;
  } catch {
    // Fall back to showing the raw slug below if products can't be loaded.
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
      <ReviewsClient reviews={reviews} productNames={productNames} />
    </main>
  );
}
