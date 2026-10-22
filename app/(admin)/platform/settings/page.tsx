import { redirect } from 'next/navigation';
import { getPlatformFeatures } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import FeatureToggles from './FeatureToggles';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Platform settings' };

/**
 * Platform-wide configuration, on its own page.
 *
 * These switches were added to the top of Platform Overview, which is a monitoring page — it
 * answers "how is the platform doing and what needs me". A six-checkbox configuration card
 * does not belong above the KPIs, and it is changed about as often as a plan is renamed.
 */
export default async function PlatformSettingsPage() {
  const admin = await getAdmin();
  if (admin?.role !== 'super') redirect('/dashboard');

  const features = await getPlatformFeatures().catch(() => ({}));

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
          BikriBazaar
        </p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Platform settings</h1>
        <p className="text-sm text-stone-400 mt-1">
          Configuration that applies to every store on the platform.
        </p>
      </div>

      <FeatureToggles initial={features} />
    </main>
  );
}
