import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getServices } from '@/lib/api';
import ServicesClient from './ServicesClient';

export const metadata = { title: 'Services — Admin' };

export default async function ServicesPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const services = await getServices().catch(() => []);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Services</h1>
        <p className="text-sm text-stone-400 mt-0.5">Manage services offered by your business.</p>
      </div>
      <ServicesClient initialServices={services} />
    </main>
  );
}
