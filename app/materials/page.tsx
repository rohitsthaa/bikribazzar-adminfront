import Nav from '@/components/Nav';
import { getMaterials } from '@/lib/api';
import { removeMaterial } from './actions';
import AddMaterialForm from './AddMaterialForm';

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-xl font-semibold mb-6">Materials</h1>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Add material</h2>
          <AddMaterialForm />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {materials.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No materials yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-sm text-gray-900">{m.label}</span>
                    <span className="text-xs text-gray-400 ml-2">order: {m.sortOrder}</span>
                  </div>
                  <form action={removeMaterial.bind(null, m.id)}>
                    <button type="submit" className="text-sm text-red-500 hover:text-red-700 transition-colors">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
