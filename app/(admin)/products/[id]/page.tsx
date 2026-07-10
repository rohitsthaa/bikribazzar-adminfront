import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { getProduct, getSettings, getCategories, getInventoryLog } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { saveProduct } from '../actions';
import InventoryPanel from './InventoryPanel';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, settings, categories, logs] = await Promise.all([
    getProduct(id).catch(() => { notFound(); }),
    getSettings().catch(() => ({} as Record<string, string>)),
    getCategories().catch(() => []),
    getInventoryLog(id).catch(() => []),
  ]);

  if (!product) notFound();

  const currency = settings.currency_symbol || 'NPR';
  const canSetPrice = can((await getAdmin())?.role, 'setPrice');

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold mt-2">Edit product</h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main form */}
        <div className="flex-1 min-w-0">
          <ProductForm product={product} action={saveProduct} categories={categories.length > 0 ? categories : undefined} canSetPrice={canSetPrice} />
        </div>

        {/* Inventory sidebar */}
        <div id="inventory-panel" className="xl:w-72 shrink-0 scroll-mt-6">
          <InventoryPanel product={product} logs={logs} currency={currency} />
        </div>
      </div>
    </main>
  );
}
