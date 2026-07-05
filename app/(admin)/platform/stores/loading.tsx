function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function PlatformStoresLoading() {
  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Sk className="h-3 w-24 rounded mb-2" />
          <Sk className="h-7 w-32 rounded-xl" />
        </div>
        <Sk className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Sk className="h-16 w-full rounded-2xl" />
        <Sk className="h-16 w-full rounded-2xl" />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-stone-100 last:border-0">
            <Sk className="h-4 w-40 rounded" />
            <Sk className="h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
