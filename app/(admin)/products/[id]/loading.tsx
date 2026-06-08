function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

function FieldSkeleton({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && <Sk className="h-3.5 w-24 rounded" />}
      <Sk className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function ProductEditLoading() {
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <Sk className="h-4 w-28 mb-6 rounded-full" />
      <div className="flex items-center justify-between mb-8">
        <Sk className="h-8 w-48 rounded-xl" />
        <Sk className="h-9 w-28 rounded-xl" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main fields */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <Sk className="h-4 w-20 rounded mb-1" />
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <FieldSkeleton />
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <Sk className="h-4 w-24 rounded mb-1" />
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <FieldSkeleton />
          </div>
        </div>

        {/* Right: image + status */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <Sk className="h-4 w-16 rounded mb-4" />
            <Sk className="aspect-square w-full rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
            <Sk className="h-4 w-20 rounded" />
            <Sk className="h-10 w-full rounded-xl" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
