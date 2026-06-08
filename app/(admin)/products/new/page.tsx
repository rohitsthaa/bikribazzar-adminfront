import Link from 'next/link';
import ProductForm from '@/components/ProductForm';
import { saveProduct } from '../actions';
import { getSettings } from '@/lib/api';

const DEFAULT_CATEGORIES = [
  { key: 'shelf',  label: 'Hanging Shelves' },
  { key: 'hanger', label: 'Plant Hangers' },
  { key: 'wall',   label: 'Wall Hangings' },
  { key: 'custom', label: 'Custom Orders' },
];

export default async function NewProductPage() {
  const settings = await getSettings().catch(() => ({} as Record<string, string>));
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
        <h1 className="text-xl font-semibold mt-2">Add product</h1>
      </div>
      <ProductForm action={saveProduct} categories={categories} />
    </main>
  );
}
