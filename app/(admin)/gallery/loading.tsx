function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function GalleryLoading() {
  return (
    <main className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <Sk className="h-8 w-24 rounded-xl mb-1" />
        <Sk className="h-4 w-44 rounded" />
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <Sk className="h-4 w-28 rounded mb-4" />
        <Sk className="h-32 w-full rounded-xl" />
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="relative group">
            <Sk className="aspect-square w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </main>
  );
}
