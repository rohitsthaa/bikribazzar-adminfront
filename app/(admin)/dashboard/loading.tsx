function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function DashboardLoading() {
  return (
    <main className="p-6 md:p-8 max-w-7xl space-y-8">
      <div>
        <Sk className="h-7 w-32 rounded-xl mb-1" />
        <Sk className="h-4 w-48 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Sk className="h-3 w-20 rounded" />
              <Sk className="w-7 h-7 rounded-full" />
            </div>
            <Sk className="h-6 w-24 rounded" />
            <Sk className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-24 rounded mb-1" />
          <Sk className="h-3.5 w-20 rounded mb-5" />
          <Sk className="h-52 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-36 rounded mb-1" />
          <Sk className="h-3.5 w-16 rounded mb-5" />
          <div className="flex items-center gap-4">
            <Sk className="w-36 h-36 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Sk className="h-3.5 w-20 rounded" />
                  <Sk className="h-3.5 w-6 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-28 rounded mb-1" />
          <Sk className="h-3.5 w-24 rounded mb-5" />
          <Sk className="h-36 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-28 rounded mb-4" />
          <div className="space-y-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Sk className="h-4 w-28 rounded" />
                  <Sk className="h-3 w-20 rounded" />
                </div>
                <div className="text-right space-y-1.5">
                  <Sk className="h-4 w-16 rounded ml-auto" />
                  <Sk className="h-4 w-14 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
