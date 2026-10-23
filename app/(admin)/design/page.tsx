import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { getStore, getSettings, getTemplates } from '@/lib/api';
import { currentStoreId } from '@/lib/store-context';
import DesignClient from './DesignClient';
import NavEditor from './NavEditor';
import FontsEditor from './FontsEditor';
import HighlightsEditor from './HighlightsEditor';

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
  const currentTemplate = templates.find((t) => t.id === currentTemplateId) ?? null;
  const themeFonts = (store?.theme?.fonts ?? {}) as { display?: string; body?: string };

  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Design</h1>
        <p className="text-sm text-stone-400 mt-0.5">Choose your template, homepage sections, fonts and highlights</p>
      </div>
      <DesignClient
        key={storeId}
        currentTemplateId={currentTemplateId}
        rawSections={settings.home_sections ?? ''}
        templates={templates}
      />
      <FontsEditor
        key={`fonts-${storeId}`}
        templateFonts={currentTemplate?.fonts ?? null}
        initialDisplay={themeFonts.display ?? ''}
        // The old Settings → Font value only ever applied as the body font.
        initialBody={themeFonts.body ?? settings.font_family ?? ''}
      />
      <HighlightsEditor key={`hl-${storeId}`} rawHighlights={settings.home_highlights ?? ''} />
      <NavEditor rawNavItems={settings.nav_items ?? ''} />
    </main>
  );
}
