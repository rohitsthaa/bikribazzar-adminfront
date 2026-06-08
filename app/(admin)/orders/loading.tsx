import React from 'react';

function Sk({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} style={style} />;
}

export default function OrdersLoading() {
  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <Sk className="h-8 w-24 rounded-xl mb-1" />
        <Sk className="h-4 w-40 rounded" />
      </div>

      {/* Tabs + export row */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="flex gap-1 flex-wrap">
          {['w-16', 'w-14', 'w-20', 'w-16', 'w-16', 'w-20'].map((w, i) => (
            <Sk key={i} className={`h-8 ${w} rounded-lg`} />
          ))}
        </div>
        <Sk className="h-8 w-28 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-200 px-5 py-3 grid grid-cols-6 gap-4">
          {['w-12', 'w-24', 'w-32', 'w-16', 'w-20', 'w-12'].map((w, i) => (
            <Sk key={i} className={`h-3.5 ${w} rounded`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-stone-100 flex items-center gap-4">
            <Sk className="h-4 w-10 rounded" />
            <Sk className="h-4 w-28 rounded flex-1" />
            <Sk className="h-4 w-36 rounded flex-1 hidden md:block" />
            <Sk className="h-4 w-20 rounded ml-auto" />
            <Sk className="h-6 w-20 rounded-full" />
            <Sk className="h-4 w-16 rounded hidden sm:block" />
            <Sk className="h-4 w-8 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
