import { getProducts, getSettings } from '@/lib/api';
import CreateOrderForm from './CreateOrderForm';

export const metadata = { title: 'New Order — Soul Thread Admin' };

export default async function NewOrderPage() {
  const [products, settings] = await Promise.all([
    getProducts().catch(() => []),
    getSettings().catch(() => ({} as Record<string, string>)),
  ]);

  const currency = settings.currency_symbol || 'NPR';
  const available = products.filter((p) => p.available);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">New Order</h1>
        <p className="text-sm text-stone-400 mt-0.5">Record an order from Instagram, TikTok, phone, or walk-in</p>
      </div>
      <CreateOrderForm products={available} currency={currency} />
    </main>
  );
}
