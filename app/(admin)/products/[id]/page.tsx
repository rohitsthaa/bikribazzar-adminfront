import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { getProduct, getSettings } from '@/lib/api';
import { saveProduct } from '../actions';

const DEFAULT_CATEGORIES = [
  { key: 'shelf',  label: 'Hanging Shelves' },
  { key: 'hanger', label: 'Plant Hangers' },
  { key: 'wall',   label: 'Wall Hangings' },
  { key: 'custom', label: 'Custom Orders' },
];

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, settings] = await Promise.all([
    getProduct(params.id).catch(() => { notFound(); }),
    getSettings().catch(() => ({} as Record<string, string>)),
  ]);

  if (!product) notFound();

  const categories = (() => {
    try { return settings.product_categories ? JSON.parse(settings.product_categories) : DEFAULT_CATEGORIES; }
    catch { return DEFAULT_CATEGORIES; }
  })();

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold mt-2">Edit product</h1>
      </div>
      <ProductForm product={product} action={saveProduct} categories={categories} />
    </main>
  );
}
