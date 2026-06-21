import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';

export default async function Home() {
  // Super-admins land in the platform lobby; store-admins/staff go straight to
  // their store dashboard.
  const admin = await getAdmin();
  redirect(admin?.role === 'super' ? '/platform' : '/dashboard');
}
