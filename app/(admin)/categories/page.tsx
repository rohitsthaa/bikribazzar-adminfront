import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { getCategories, getProducts } from '@/lib/api';
import CategoriesClient from './CategoriesClient';

export const metadata = { title: 'Categories — Bikri Bazaar' };

export default async function CategoriesPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const [categories, uncategorised] = await Promise.all([
    getCategories().catch(() => []),
    // Only the total matters; limit 1 keeps it to a count query plus one row.
    getProducts({ category: 'none', limit: 1 }).then((r) => r.total).catch(() => 0),
  ]);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Categories</h1>
        <p className="text-sm text-stone-400 mt-0.5">Group your products for the shop menu and filters. Categories with no live products are left out of the menu automatically.</p>
      </div>
      <CategoriesClient
        initialCategories={categories}
        uncategorised={uncategorised}
        canEdit={can(admin.role, 'settings')}
      />
    </main>
  );
}
