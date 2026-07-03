import { redirect } from 'next/navigation';
import { getAllAdminUsers, getStores } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function PlatformUsersPage() {
  const admin = await getAdmin();
  if (admin?.role !== 'super') redirect('/dashboard');

  const [users, stores] = await Promise.all([
    getAllAdminUsers().catch(() => []),
    getStores().catch(() => []),
  ]);

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
          BikriBazaar
        </p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Users</h1>
        <p className="text-sm text-stone-400 mt-1">
          {users.length} admin account{users.length !== 1 ? 's' : ''} across {stores.length} store{stores.length !== 1 ? 's' : ''}
        </p>
      </div>
      <UsersClient users={users} stores={stores} />
    </main>
  );
}
