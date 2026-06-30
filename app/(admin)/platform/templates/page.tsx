import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getAllTemplates, getStores } from '@/lib/api';
import TemplatesClient from './TemplatesClient';

export const dynamic = 'force-dynamic';

export default async function PlatformTemplatesPage() {
  const me = await getAdmin();
  if (me?.role !== 'super') redirect('/dashboard');

  const [allTemplates, stores] = await Promise.all([
    getAllTemplates().catch(() => []),
    getStores().catch(() => []),
  ]);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Templates</h1>
        <p className="text-sm text-stone-400 mt-1">
          Manage which themes are exclusive and which stores can access them.
        </p>
      </div>

      <TemplatesClient allTemplates={allTemplates} stores={stores} />
    </main>
  );
}
