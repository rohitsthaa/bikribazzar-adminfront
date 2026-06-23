import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getPortfolioWorks } from '@/lib/api';
import WorksClient from './WorksClient';

export const metadata = { title: 'Portfolio — Admin' };

export default async function PortfolioPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const works = await getPortfolioWorks().catch(() => []);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Portfolio</h1>
        <p className="text-sm text-stone-400 mt-0.5">Manage portfolio works displayed on your storefront.</p>
      </div>
      <WorksClient initialWorks={works} />
    </main>
  );
}
