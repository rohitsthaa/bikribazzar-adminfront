import Link from 'next/link';
import { getProducts } from '@/lib/api';
import { toggleAvailability } from './actions';

const CATEGORY_COLORS: Record<string, string> = {
  shelf: 'bg-amber-100 text-amber-700',
  hanger: 'bg-teal-100 text-teal-700',
  wall: 'bg-violet-100 text-violet-700',
  custom: 'bg-rose-100 text-rose-700',
};

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

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="text-4xl mb-3">🪴</div>
            <p className="text-gray-500 font-medium">No products yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first handwoven piece to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div
                key={p.id}
                className={`group bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
                  p.available ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Tag badge */}
                  {p.tag && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-700 rounded-full shadow-sm">
                      {p.tag}
                    </span>
                  )}
                  {/* Availability pill */}
                  <div className="absolute top-2.5 right-2.5">
                    <form action={toggleAvailability.bind(null, p.id, !p.available)}>
                      <button
                        type="submit"
                        title="Toggle availability"
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors shadow-sm ${
                          p.available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {p.available ? '● Live' : '○ Hidden'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{p.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.id}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.category}
                    </span>
                  </div>

                  {p.details && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-1">{p.details}</p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-900">
                      {p.priceNpr === 0 ? (
                        <span className="text-gray-400 font-normal">On request</span>
                      ) : (
                        <>NPR {p.priceNpr.toLocaleString()}</>
                      )}
                    </span>
                    <Link
                      href={`/products/${p.id}`}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}
