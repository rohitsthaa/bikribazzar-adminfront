import Link from 'next/link';
import { getProducts } from '@/lib/api';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm rounded-xl transition-colors font-medium shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Add product
        </Link>
      </div>

      <ProductsClient products={products} />
    </main>
  );
}
