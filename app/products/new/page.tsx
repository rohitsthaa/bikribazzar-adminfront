import Link from 'next/link';
import Nav from '@/components/Nav';
import ProductForm from '@/components/ProductForm';
import { saveProduct } from '../actions';

export default function NewProductPage() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Products
          </Link>
          <h1 className="text-xl font-semibold mt-2">Add product</h1>
        </div>
        <ProductForm action={saveProduct} />
      </main>
    </>
  );
}
