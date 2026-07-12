import { getLedgerEntries, getFinanceCategories, getSettings } from '@/lib/api';
import TransactionsClient from './TransactionsClient';

export const metadata = { title: 'Transactions — Soul Thread Admin' };

export default async function TransactionsPage() {
  let entries: Awaited<ReturnType<typeof getLedgerEntries>> = [];
  let categories: Awaited<ReturnType<typeof getFinanceCategories>> = [];
  let currency = 'NPR';

  try {
    [entries, categories] = await Promise.all([
      getLedgerEntries(),
      getFinanceCategories(),
    ]);
    currency = await getSettings().then((s) => s.currency_symbol || 'NPR').catch(() => 'NPR');
  } catch {
    // API unavailable or migration not yet run — show empty state
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Transactions</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} — manual bookkeeping plus auto-synced order payments
        </p>
      </div>

      <TransactionsClient entries={entries} categories={categories} currency={currency} />
    </main>
  );
}
