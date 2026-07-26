import { getNcmBranches, getNcmPricingList } from '@/lib/api';
import CourierClient from './CourierClient';

export const metadata = { title: 'Courier — Soul Thread Admin' };

export default async function CourierPage() {
  let branchesError: string | null = null;
  let pricingError: string | null = null;
  const [branches, pricing] = await Promise.all([
    getNcmBranches().catch((e) => { branchesError = e instanceof Error ? e.message : 'Could not load branches'; return null; }),
    getNcmPricingList().catch((e) => { pricingError = e instanceof Error ? e.message : 'Could not load price list'; return null; }),
  ]);

  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-start gap-3 mb-6">
        <span className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-[#c96a3a]/10 text-[#c96a3a] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Courier — NCM</h1>
          <p className="text-sm text-stone-500 mt-0.5">Branch directory and delivery pricing reference from Nepal Can Move.</p>
        </div>
      </div>

      <CourierClient branches={branches} branchesError={branchesError} pricing={pricing} pricingError={pricingError} />
    </main>
  );
}
