function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function CouponsLoading() {
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Sk className="h-8 w-28 rounded-xl mb-1.5" />
        <Sk className="h-4 w-52 rounded" />
      </div>

      <div className="space-y-8">
        {/* Create form card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <Sk className="h-5 w-28 rounded mb-5" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-4">
            <Sk className="h-9 rounded-lg" />
            <Sk className="h-9 rounded-lg" />
            <Sk className="h-9 rounded-lg" />
            <Sk className="h-9 rounded-lg" />
            <Sk className="h-9 rounded-lg" />
          </div>
          <Sk className="h-9 w-32 rounded-lg" />
        </div>

        {/* Coupon list */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 grid grid-cols-5 gap-4">
            {['w-16', 'w-20', 'w-14', 'w-20', 'w-12'].map((w, i) => (
              <Sk key={i} className={`h-3.5 ${w} rounded`} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-stone-100 grid grid-cols-5 gap-4 items-center">
              <Sk className="h-6 w-20 rounded-full" />
              <Sk className="h-4 w-16 rounded" />
              <Sk className="h-4 w-10 rounded" />
              <Sk className="h-4 w-24 rounded" />
              <div className="flex gap-2">
                <Sk className="h-6 w-12 rounded-lg" />
                <Sk className="h-6 w-14 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
