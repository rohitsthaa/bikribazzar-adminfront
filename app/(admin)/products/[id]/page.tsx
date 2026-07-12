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
      <ProductForm
        product={product}
        action={saveProduct}
        categories={categories.length > 0 ? categories : undefined}
        canSetPrice={canSetPrice}
        inventoryPanel={<InventoryPanel product={product} logs={logs} currency={currency} />}
      />
    </main>
  );
}
