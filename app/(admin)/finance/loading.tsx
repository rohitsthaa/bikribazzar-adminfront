function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function FinanceLoading() {
  return (
    <main className="p-6 md:p-8 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Sk className="h-8 w-28 rounded-xl mb-1.5" />
          <Sk className="h-4 w-64 rounded" />
        </div>
        <Sk className="h-10 w-40 rounded-xl" />
      </div>

      <Sk className="h-9 w-72 rounded-xl" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <Sk className="h-4 w-16 rounded" />
            <Sk className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-40 rounded mb-5" />
          <Sk className="h-56 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-24 rounded mb-5" />
          <Sk className="h-56 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
