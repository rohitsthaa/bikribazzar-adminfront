function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function OrderDetailLoading() {
  return (
    <main className="p-6 md:p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <Skeleton className="h-4 w-24 mb-4 rounded-full" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="text-right space-y-1.5">
            <Skeleton className="h-8 w-28 rounded-xl ml-auto" />
            <Skeleton className="h-3.5 w-40 rounded ml-auto" />
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
        <div className="flex items-center gap-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              {i < 3 && <div className="h-0.5 flex-1 mx-2 mb-5 rounded-full bg-stone-100" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Line items */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <Skeleton className="h-5 w-16 rounded" />
            </div>
            <div className="divide-y divide-stone-100">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-5 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-stone-100">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-6 w-28 rounded" />
            </div>
          </div>

          {/* Customer card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-start gap-4 mb-5">
              <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-4 w-52 rounded" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 pt-4 border-t border-stone-100">
              <Skeleton className="flex-1 h-10 rounded-xl" />
              <Skeleton className="flex-1 h-10 rounded-xl" />
              <Skeleton className="flex-1 h-10 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <Skeleton className="h-4 w-28 rounded mb-3" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>

          {/* Payment card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
            <Skeleton className="h-4 w-20 rounded mb-1" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            ))}
            <div className="pt-2 space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-10 rounded-xl" />
                <Skeleton className="w-20 h-10 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Timeline card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <Skeleton className="h-4 w-20 rounded mb-4" />
            <div className="space-y-4 ml-1.5">
              {[0, 1].map((i) => (
                <div key={i} className="pl-5 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
