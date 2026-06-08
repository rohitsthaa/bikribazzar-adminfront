function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function MaterialsLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Sk className="h-8 w-28 rounded-xl mb-1" />
        <Sk className="h-4 w-52 rounded" />
      </div>

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
        <Sk className="h-4 w-24 rounded mb-4" />
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Sk className="h-3.5 w-12 rounded" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
          <div className="w-28 space-y-1.5">
            <Sk className="h-3.5 w-16 rounded" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
          <Sk className="h-10 w-20 rounded-xl" />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <Sk className="h-4 w-36 rounded" />
              <Sk className="h-3.5 w-16 rounded" />
            </div>
            <Sk className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
