import Link from 'next/link';
import { getProducts, getSettings } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import ProductsClient from './ProductsClient';
import CsvImportButton from './CsvImportButton';

export default async function ProductsPage() {
  const [products, settings, admin] = await Promise.all([
    getProducts(),
    getSettings().catch(() => ({} as Record<string, string>)),
    getAdmin(),
  ]);
  const currency = settings.currency_symbol || 'NPR';
  const canDelete = can(admin?.role, 'deleteProduct');

  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton />
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm rounded-xl transition-colors font-medium shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Add product
          </Link>
        </div>
      </div>

      <ProductsClient products={products} currency={currency} canDelete={canDelete} />
    </main>
  );
}
