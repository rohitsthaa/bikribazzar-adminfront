function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function CustomersLoading() {
  return (
    <main className="p-6 md:p-8 max-w-5xl space-y-6">
      <div>
        <Sk className="h-8 w-32 rounded-xl mb-1.5" />
        <Sk className="h-4 w-44 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <Sk className="h-7 w-7 rounded-lg" />
            <Sk className="h-7 w-16 rounded" />
            <Sk className="h-3.5 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-100">
            <Sk className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Sk className="h-4 w-36 rounded" />
              <Sk className="h-3 w-56 rounded" />
            </div>
            <div className="text-right space-y-1.5">
              <Sk className="h-5 w-24 rounded ml-auto" />
              <Sk className="h-3 w-32 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
