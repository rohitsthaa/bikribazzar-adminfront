import Link from 'next/link';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import ProductForm from '@/components/ProductForm';
import { getProduct } from '@/lib/api';
import { saveProduct } from '../actions';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  let product;
  try {
    product = await getProduct(params.id);
  } catch {
    notFound();
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Products
          </Link>
          <h1 className="text-xl font-semibold mt-2">Edit product</h1>
        </div>
        <ProductForm product={product} action={saveProduct} />
      </main>
    </>
  );
}
