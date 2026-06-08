function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function ProductsLoading() {
  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Sk className="h-8 w-28 rounded-xl mb-1" />
          <Sk className="h-4 w-36 rounded" />
        </div>
        <Sk className="h-9 w-32 rounded-xl" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
        {[64, 48, 52].map((w, i) => (
          <Sk key={i} className="h-8 rounded-lg" style={{ width: w }} />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <Sk className="aspect-[4/3] w-full rounded-none" />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Sk className="h-4 w-3/4 rounded" />
                  <Sk className="h-3 w-1/2 rounded" />
                </div>
                <Sk className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <Sk className="h-5 w-20 rounded" />
                <div className="flex gap-2">
                  <Sk className="h-8 w-8 rounded-lg" />
                  <Sk className="h-8 w-14 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
