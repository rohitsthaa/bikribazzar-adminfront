'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export type RevenueDay = { date: string; revenue: number; orders: number };
export type StatusCount = { name: string; value: number; color: string };
export type TopProduct = { name: string; revenue: number; orders: number };

const STATUS_COLORS: Record<string, string> = {
  new:       '#3b82f6',
  confirmed: '#f59e0b',
  shipped:   '#a855f7',
  delivered: '#22c55e',
  cancelled: '#9ca3af',
};

function fmt(n: number, currency: string) {
  if (n >= 100000) return `${currency} ${(n / 1000).toFixed(0)}k`;
  return `${currency} ${n.toLocaleString()}`;
}

/* ── Revenue bar chart ─────────────────────────────────────────────── */
export function RevenueChart({ data, currency }: { data: RevenueDay[]; currency: string }) {
  if (data.every(d => d.revenue === 0)) {
    return <Empty label="No revenue data yet" />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={10}>
        <XAxis
          dataKey="date"
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
          width={60}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as RevenueDay;
            return (
              <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-2.5 text-xs space-y-0.5">
                <p className="font-semibold text-stone-700">{label}</p>
                <p className="text-stone-500">{currency} {d.revenue.toLocaleString()}</p>
                <p className="text-stone-400">{d.orders} {d.orders === 1 ? 'order' : 'orders'}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="revenue" fill="#c96a3a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Status donut ──────────────────────────────────────────────────── */
export function StatusDonut({ data }: { data: StatusCount[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <Empty label="No orders yet" />;
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={62}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.filter(d => d.value > 0).map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-stone-600 capitalize">{d.name}</span>
            </div>
            <span className="font-semibold text-stone-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Top products horizontal bar ───────────────────────────────────── */
export function TopProductsChart({ data, currency }: { data: TopProduct[]; currency: string }) {
  if (data.length === 0) return <Empty label="No product data yet" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 120)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        barSize={14}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: '#a8a29e' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => fmt(v, currency)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#57534e' }}
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as TopProduct;
            return (
              <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-2.5 text-xs space-y-0.5">
                <p className="font-semibold text-stone-700">{d.name}</p>
                <p className="text-stone-500">{currency} {d.revenue.toLocaleString()}</p>
                <p className="text-stone-400">{d.orders} {d.orders === 1 ? 'order' : 'orders'}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="revenue" fill="#78716c" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-sm text-stone-400">{label}</div>
  );
}
