function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function PlatformLoading() {
  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <Sk className="h-3 w-24 rounded mb-2" />
        <Sk className="h-7 w-52 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <Sk className="h-3 w-16 rounded" />
            <Sk className="h-6 w-20 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-stone-100 last:border-0">
            <Sk className="h-4 w-40 rounded" />
            <Sk className="h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
