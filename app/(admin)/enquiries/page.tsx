import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getLeads } from '@/lib/api';
import EnquiriesClient from './EnquiriesClient';

export const metadata = { title: 'Enquiries — Admin' };

export default async function EnquiriesPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const leads = await getLeads().catch(() => []);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Enquiries</h1>
        <p className="text-sm text-stone-400 mt-0.5">Contact form submissions from store visitors.</p>
      </div>
      <EnquiriesClient leads={leads} />
    </main>
  );
}
