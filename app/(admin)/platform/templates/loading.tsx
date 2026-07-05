function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function PlatformTemplatesLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Sk className="h-7 w-32 rounded-xl mb-1" />
        <Sk className="h-4 w-56 rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4">
            <Sk className="w-14 h-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-1/3 rounded" />
              <Sk className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
