function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function DeliveryLoading() {
  return (
    <main className="p-6 md:p-8 max-w-5xl space-y-6">
      <div>
        <Sk className="h-8 w-44 rounded-xl mb-1.5" />
        <Sk className="h-4 w-56 rounded" />
      </div>

      {/* Area groups */}
      {[4, 3].map((rowCount, gi) => (
        <div key={gi} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {/* Area header */}
          <div className="flex items-center gap-3 px-6 py-4 bg-stone-50 border-b border-stone-100">
            <Sk className="w-4 h-4 rounded flex-shrink-0" />
            <Sk className="h-4 w-36 rounded" />
            <Sk className="h-5 w-14 rounded-full ml-auto" />
          </div>
          {/* Order rows */}
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-100">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sk className="h-4 w-32 rounded" />
                  <Sk className="h-5 w-16 rounded-full" />
                </div>
                <Sk className="h-3 w-52 rounded" />
              </div>
              <div className="text-right space-y-1.5">
                <Sk className="h-5 w-20 rounded ml-auto" />
                <Sk className="h-3 w-12 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}
