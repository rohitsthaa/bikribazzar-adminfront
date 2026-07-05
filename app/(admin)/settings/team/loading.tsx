function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function TeamLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Sk className="h-7 w-20 rounded-xl mb-1" />
        <Sk className="h-4 w-56 rounded" />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-stone-100 last:border-0">
            <div className="space-y-1.5">
              <Sk className="h-4 w-40 rounded" />
              <Sk className="h-3 w-20 rounded" />
            </div>
            <Sk className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
