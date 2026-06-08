import { getCoupons } from '@/lib/api';
import CouponsClient from './CouponsClient';

export const metadata = { title: 'Coupons — Soul Thread Admin' };

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Coupons</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {coupons.filter((c) => c.active).length} active — customers enter these at checkout for a discount
        </p>
      </div>

      <CouponsClient coupons={coupons} />
    </main>
  );
}
