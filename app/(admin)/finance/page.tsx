import Link from 'next/link';
import { getFinanceSummary, getSettings, type FinanceSummary } from '@/lib/api';
import { IncomeExpenseChart, CategoryBreakdown } from './FinanceCharts';

export const metadata = { title: 'Finance — Soul Thread Admin' };

const RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '12m', label: '12 months' },
  { key: 'ytd', label: 'Year to date' },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

function rangeToParams(range: RangeKey): { from: string; groupBy: 'day' | 'month' | 'year' } {
  const now = new Date();
  switch (range) {
    case '7d':
      return { from: new Date(now.getTime() - 7 * 86400000).toISOString(), groupBy: 'day' };
    case '12m':
      return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString(), groupBy: 'month' };
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), groupBy: 'month' };
    case '30d':
    default:
      return { from: new Date(now.getTime() - 30 * 86400000).toISOString(), groupBy: 'day' };
  }
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: RangeKey = RANGES.some((r) => r.key === rangeParam) ? (rangeParam as RangeKey) : '30d';
  const { from, groupBy } = rangeToParams(range);

  let summary: FinanceSummary | null = null;
  let currency = 'NPR';
  try {
    [summary] = await Promise.all([
      getFinanceSummary({ from, groupBy }),
      getSettings().then((s) => { currency = s.currency_symbol || 'NPR'; }).catch(() => {}),
    ]);
  } catch {
    // API unavailable or migration not yet run — show empty state
  }

  const totalIncomeNpr = summary?.totalIncomeNpr ?? 0;
  const totalExpenseNpr = summary?.totalExpenseNpr ?? 0;
  const netNpr = summary?.netNpr ?? 0;

  const stats = [
    {
      label: 'Income', value: `${currency} ${totalIncomeNpr.toLocaleString()}`,
      accent: 'border-emerald-400', bg: 'bg-emerald-50', fg: 'text-emerald-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
    {
      label: 'Expenses', value: `${currency} ${totalExpenseNpr.toLocaleString()}`,
      accent: 'border-red-400', bg: 'bg-red-50', fg: 'text-red-500',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    },
    {
      label: 'Net', value: `${netNpr < 0 ? '-' : ''}${currency} ${Math.abs(netNpr).toLocaleString()}`,
      accent: netNpr >= 0 ? 'border-blue-400' : 'border-orange-400',
      bg: netNpr >= 0 ? 'bg-blue-50' : 'bg-orange-50', fg: netNpr >= 0 ? 'text-blue-600' : 'text-orange-600',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    },
  ];

  return (
    <main className="p-6 md:p-8 max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Finance</h1>
          <p className="text-sm text-stone-500 mt-0.5">Profit &amp; loss and cash flow at a glance</p>
        </div>
        <Link
          href="/finance/transactions"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add transaction
        </Link>
      </div>

      {/* Range tabs */}
      <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/finance?range=${r.key}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === r.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border border-stone-200 border-b-2 ${s.accent} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide leading-tight">{s.label}</p>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${s.bg} ${s.fg} flex-shrink-0`}>
                {s.icon}
              </span>
            </div>
            <p className="text-xl font-bold text-stone-900 leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-stone-900">Income vs expenses</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {RANGES.find((r) => r.key === range)?.label}
            </p>
          </div>
          <IncomeExpenseChart data={summary?.timeline ?? []} currency={currency} />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-stone-900">By category</h2>
            <p className="text-xs text-stone-400 mt-0.5">Top spending &amp; income sources</p>
          </div>
          <CategoryBreakdown data={summary?.byCategory ?? []} currency={currency} />
        </div>
      </div>
    </main>
  );
}
