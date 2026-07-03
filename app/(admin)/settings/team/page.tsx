import { redirect } from 'next/navigation';
import { getStoreAdmins } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, 'settings')) redirect('/dashboard');

  const storeId = await currentStoreId();
  const members = await getStoreAdmins(storeId).catch(() => []);

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Team</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Manage who can access this store&apos;s admin panel.
        </p>
      </div>
      <TeamClient members={members} meId={admin?.id ?? null} />
    </main>
  );
}
