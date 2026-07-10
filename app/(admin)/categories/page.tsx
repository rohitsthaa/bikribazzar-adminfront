import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getCategories } from '@/lib/api';
import CategoriesClient from './CategoriesClient';

export const metadata = { title: 'Categories — Admin' };

export default async function CategoriesPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const categories = await getCategories().catch(() => []);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Categories</h1>
        <p className="text-sm text-stone-400 mt-0.5">Manage the categories products can be filed under — shown in the storefront nav and shop filters.</p>
      </div>
      <CategoriesClient initialCategories={categories} />
    </main>
  );
}
