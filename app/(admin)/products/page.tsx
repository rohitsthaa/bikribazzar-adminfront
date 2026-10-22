import Link from 'next/link';
import { getProducts, getSettings, getCategories } from '@/lib/api';
import Pager from '@/components/Pager';
import { getAdmin, can } from '@/lib/auth';
import ProductsClient from './ProductsClient';
import CsvImportButton from './CsvImportButton';

const PAGE_SIZE = 50;

// Bucket and page live in the URL, so the filter runs in SQL and the counts on the tabs
// describe the whole catalogue rather than whatever happens to be on screen.
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const bucket = sp.bucket ?? 'all';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const [res, settings, admin, categories] = await Promise.all([
    getProducts({ bucket, page, limit: PAGE_SIZE }),
    getSettings().catch(() => ({} as Record<string, string>)),
    getAdmin(),
    // Arrives with the page load, so the import grid can offer real categories as a
    // dropdown instead of a free-text key that silently lands products uncategorised.
    getCategories().catch(() => []),
  ]);
  const products = res.items;
  const currency = settings.currency_symbol || 'NPR';
  const canDelete = can(admin?.role, 'deleteProduct');

  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{res.counts.all.toLocaleString()} item{res.counts.all !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton
            categories={categories.map((c) => ({ key: c.key, label: c.label }))}
            currency={currency}
          />
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm rounded-xl transition-colors font-medium shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Add product
          </Link>
        </div>
      </div>

      <ProductsClient products={products} currency={currency} canDelete={canDelete} counts={res.counts} bucket={bucket} />
      <Pager page={page} limit={PAGE_SIZE} total={res.total} basePath="/products" params={{ bucket: bucket === 'all' ? undefined : bucket }} />
    </main>
  );
}
