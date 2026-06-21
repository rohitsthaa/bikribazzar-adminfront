import Link from 'next/link';
import { getStores } from '@/lib/api';
import { createStoreAction } from './actions';

export const dynamic = 'force-dynamic';

export const TEMPLATES = [
  { id: 'soulthread', name: 'Soul Thread (warm / artisan)' },
  { id: 'aurora', name: 'Aurora (modern / minimal)' },
];

export default async function PlatformPage() {
  const stores = await getStores().catch(() => []);

  return (
    <main className="p-6 md:p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Platform</h1>
        <p className="text-stone-500 mt-1">Provision and manage stores on this platform.</p>
      </div>

      {/* Stores list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-left text-stone-500">
            <tr>
              <th className="px-5 py-3 font-medium">Store</th>
              <th className="px-5 py-3 font-medium">Template</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {stores.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-stone-400">No stores yet.</td></tr>
            ) : stores.map((s) => (
              <tr key={s.id} className="hover:bg-stone-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-stone-900">{s.name}</div>
                  <div className="text-xs text-stone-400">{s.id}</div>
                </td>
                <td className="px-5 py-3 text-stone-600">{s.templateId}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/platform/${s.id}`} className="text-[#c96a3a] font-medium hover:underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create store */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-900 mb-4">Create a store</h2>
        <form action={createStoreAction} className="grid sm:grid-cols-3 gap-3 items-end">
          <label className="block text-sm">
            <span className="text-stone-500">Slug</span>
            <input name="id" required pattern="[a-z0-9-]+" placeholder="acme-home"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-stone-500">Name</span>
            <input name="name" required placeholder="Acme Home"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-stone-500">Template</span>
            <select name="templateId" className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm">
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <button type="submit" className="sm:col-span-3 justify-self-start rounded-lg bg-stone-800 text-white px-4 py-2 text-sm font-medium hover:bg-stone-700">
            Create store
          </button>
        </form>
        <p className="text-xs text-stone-400 mt-3">
          The slug is permanent and used for the default subdomain. Set payment credentials and theme after creating.
        </p>
      </div>
    </main>
  );
}
