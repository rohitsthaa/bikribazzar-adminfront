import Link from 'next/link';
import { getProducts, getSettings, getCategories } from '@/lib/api';
import Pager from '@/components/Pager';
import { getAdmin, can } from '@/lib/auth';
import ProductsClient from './ProductsClient';
import CsvImportButton from './CsvImportButton';

const PAGE_SIZE = 50;

// Bucket, search, category, sort, view and page all live in the URL, so filtering runs in
// SQL, the tab counts describe the whole (searched) catalogue rather than whatever happens
// to be on screen, and a filtered view can be bookmarked.
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string; page?: string; q?: string; category?: string; sort?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const bucket = sp.bucket ?? 'all';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const q = (sp.q ?? '').trim();
  const category = sp.category ?? '';
  const sort = sp.sort ?? '';
  // The list view is the default: it fits ~4x more products per screen than cards.
  const view = sp.view === 'grid' ? 'grid' : 'table';

  const [res, settings, admin, categories] = await Promise.all([
    getProducts({ bucket, page, limit: PAGE_SIZE, q, category, sort }),
    getSettings().catch(() => ({} as Record<string, string>)),
    getAdmin(),
    // Arrives with the page load, so the import grid can offer real categories as a
    // dropdown instead of a free-text key that silently lands products uncategorised.
    getCategories().catch(() => []),
  ]);
  const products = res.items;
  const currency = settings.currency_symbol || 'NPR';
  const canDelete = can(admin?.role, 'deleteProduct');
  const canPrice = can(admin?.role, 'setPrice');
  const sampleIds = 'sampleIds' in res && Array.isArray(res.sampleIds) ? res.sampleIds : [];

  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-6">
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
            className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm rounded-xl transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <span className="text-lg leading-none">+</span> Add product
          </Link>
        </div>
      </div>

      <ProductsClient
        products={products} currency={currency} canDelete={canDelete} canPrice={canPrice}
        counts={res.counts} bucket={bucket}
        categories={categories.map((c) => ({ key: c.key, label: c.label, id: c.id }))}
        q={q} category={category} sort={sort} view={view} sampleIds={sampleIds}
      />
      <Pager
        page={page} limit={PAGE_SIZE} total={res.total} basePath="/products"
        params={{
          bucket: bucket === 'all' ? undefined : bucket,
          q: q || undefined, category: category || undefined, sort: sort || undefined,
          view: view === 'grid' ? 'grid' : undefined,
        }}
      />
    </main>
  );
}
