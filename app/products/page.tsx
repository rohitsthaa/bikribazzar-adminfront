import Link from 'next/link';
import Nav from '@/components/Nav';
import { getProducts } from '@/lib/api';
import { toggleAvailability } from './actions';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Products</h1>
          <Link
            href="/products/new"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm rounded-lg transition-colors"
          >
            + Add product
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <p className="text-center text-gray-400 py-16 text-sm">No products yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Price (NPR)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{p.category}</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {p.priceNpr === 0 ? 'On request' : p.priceNpr.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleAvailability.bind(null, p.id, !p.available)}>
                        <button
                          type="submit"
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            p.available
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {p.available ? 'Available' : 'Hidden'}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/products/${p.id}`}
                        className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
