import Link from 'next/link';
import ProductForm from '@/components/ProductForm';
import { saveProduct } from '../actions';
import { getCategories } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';

export default async function NewProductPage() {
  const categories = await getCategories().catch(() => []);
  const canSetPrice = can((await getAdmin())?.role, 'setPrice');

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold mt-2">Add product</h1>
      </div>
      <ProductForm action={saveProduct} categories={categories.length > 0 ? categories : undefined} canSetPrice={canSetPrice} />
    </main>
  );
}
