import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { getStore, getSettings, getTemplates } from '@/lib/api';
import { currentStoreId } from '@/lib/store-context';
import DesignClient from './DesignClient';
import NavEditor from './NavEditor';

export const metadata = { title: 'Design — Admin' };

export default async function DesignPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) redirect('/dashboard');

  const storeId = await currentStoreId();
  const [store, settings, templates] = await Promise.all([
    getStore(storeId).catch(() => null),
    getSettings().catch(() => ({} as Record<string, string>)),
    getTemplates().catch(() => []),
  ]);
  const currentTemplateId = store?.templateId ?? 'soulthread';

  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Design</h1>
        <p className="text-sm text-stone-400 mt-0.5">Choose your template and configure homepage sections</p>
      </div>
      <DesignClient
        key={storeId}
        currentTemplateId={currentTemplateId}
        rawSections={settings.home_sections ?? ''}
        templates={templates}
      />
      <NavEditor rawNavItems={settings.nav_items ?? ''} />
    </main>
  );
}
