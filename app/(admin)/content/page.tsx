import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { getSettings } from '@/lib/api';
import { currentStoreId } from '@/lib/store-context';
import ContentClient from './ContentClient';

export const metadata = { title: 'Content — Admin' };

export default async function ContentPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) redirect('/dashboard');

  const [settings, storeId] = await Promise.all([
    getSettings().catch(() => ({} as Record<string, string>)),
    currentStoreId(),
  ]);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Content</h1>
        <p className="text-sm text-stone-400 mt-0.5">Edit your About and Custom orders pages</p>
      </div>
      <ContentClient
        key={storeId}
        initialAboutTitle={settings.about_title ?? ''}
        initialAboutBody={settings.about_body ?? ''}
        initialAboutImage={settings.about_image ?? ''}
        initialCustomTitle={settings.custom_title ?? ''}
        initialCustomBody={settings.custom_body ?? ''}
        whatsapp={settings.contact_whatsapp ?? ''}
      />
    </main>
  );
}
