import { getMaterials } from '@/lib/api';
import { removeMaterial } from './actions';
import AddMaterialForm from './AddMaterialForm';

export const metadata = { title: 'Materials — Soul Thread Admin' };

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Materials</h1>
        <p className="text-sm text-stone-400 mt-0.5">Materials shown on the storefront about section</p>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
        <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">Add material</h2>
        <AddMaterialForm />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {materials.length === 0 ? (
          <p className="text-center text-stone-400 py-12 text-sm">No materials yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors">
                <div>
                  <span className="text-sm font-medium text-stone-800">{m.label}</span>
                  <span className="text-xs text-stone-400 ml-2">order: {m.sortOrder}</span>
                </div>
                <form action={removeMaterial.bind(null, m.id)}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-stone-400 hover:text-red-600 bg-stone-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
