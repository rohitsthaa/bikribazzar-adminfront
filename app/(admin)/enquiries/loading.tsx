function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function EnquiriesLoading() {
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Sk className="h-7 w-28 rounded-xl mb-1" />
        <Sk className="h-4 w-64 rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <Sk className="h-4 w-32 rounded" />
              <Sk className="h-3 w-20 rounded" />
            </div>
            <Sk className="h-3 w-full rounded" />
            <Sk className="h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
