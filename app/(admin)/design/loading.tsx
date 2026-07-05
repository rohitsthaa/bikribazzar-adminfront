function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function DesignLoading() {
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <Sk className="h-7 w-24 rounded-xl mb-1" />
        <Sk className="h-4 w-56 rounded" />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <Sk className="h-4 w-28 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Sk key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
        <Sk className="h-4 w-32 rounded mb-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Sk key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
