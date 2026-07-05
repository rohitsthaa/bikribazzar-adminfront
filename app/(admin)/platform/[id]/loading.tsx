function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-stone-100">
        <Sk className="h-4 w-32 rounded" />
      </div>
      <div className="px-6 py-5 space-y-3">
        <Sk className="h-10 w-full rounded-lg" />
        <Sk className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function StoreManageLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl space-y-8">
      <div>
        <Sk className="h-3 w-20 rounded mb-4" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Sk className="h-7 w-48 rounded-xl" />
            <Sk className="h-4 w-32 rounded" />
          </div>
          <Sk className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </main>
  );
}
