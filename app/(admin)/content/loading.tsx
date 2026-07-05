function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

export default function ContentLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Sk className="h-7 w-28 rounded-xl mb-1" />
        <Sk className="h-4 w-64 rounded" />
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 space-y-4">
          <Sk className="h-4 w-32 rounded" />
          <Sk className="h-10 w-full rounded-xl" />
          <Sk className="h-24 w-full rounded-xl" />
        </div>
      ))}
    </main>
  );
}
