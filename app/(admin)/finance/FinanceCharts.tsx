'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { FinanceSummary } from '@/lib/api';

function fmt(n: number, currency: string) {
  if (Math.abs(n) >= 100000) return `${currency} ${(n / 1000).toFixed(0)}k`;
  return `${currency} ${n.toLocaleString()}`;
}

function Empty({ label }: { label: string }) {
  return <div className="flex items-center justify-center h-32 text-sm text-stone-400">{label}</div>;
}

/* ── Income vs expense over time ───────────────────────────────────── */
export function IncomeExpenseChart({ data, currency }: { data: FinanceSummary['timeline']; currency: string }) {
  if (data.every((d) => d.incomeNpr === 0 && d.expenseNpr === 0)) {
    return <Empty label="No transactions in this period" />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10, fill: '#a8a29e' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#a8a29e' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => fmt(v, currency)}
          width={64}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as FinanceSummary['timeline'][number];
            return (
              <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-2.5 text-xs space-y-0.5">
                <p className="font-semibold text-stone-700">{label}</p>
                <p className="text-emerald-600">Income: {currency} {d.incomeNpr.toLocaleString()}</p>
                <p className="text-red-500">Expense: {currency} {d.expenseNpr.toLocaleString()}</p>
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="incomeNpr" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenseNpr" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Category breakdown ────────────────────────────────────────────── */
export function CategoryBreakdown({ data, currency }: { data: FinanceSummary['byCategory']; currency: string }) {
  if (data.length === 0) return <Empty label="No transactions in this period" />;
  const max = Math.max(...data.map((d) => d.amountNpr), 1);
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((c) => (
        <div key={c.categoryId} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">{c.categoryName}</span>
            <span className={c.type === 'income' ? 'text-emerald-600 font-semibold' : 'text-stone-700 font-semibold'}>
              {currency} {c.amountNpr.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${c.type === 'income' ? 'bg-emerald-500' : 'bg-stone-400'}`}
              style={{ width: `${Math.max((c.amountNpr / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
