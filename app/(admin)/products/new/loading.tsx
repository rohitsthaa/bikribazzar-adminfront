function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

function Field({ wide }: { wide?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Sk className="h-3.5 w-20 rounded" />
      <Sk className={`h-10 rounded-lg ${wide ? 'h-24' : ''}`} />
    </div>
  );
}

export default function NewProductLoading() {
  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <Sk className="h-4 w-20 rounded mb-2" />
        <Sk className="h-7 w-32 rounded-xl" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col — main fields */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <Field />{/* name */}
            <div className="space-y-1.5">
              <Sk className="h-3.5 w-24 rounded" />
              <Sk className="h-28 rounded-lg" />{/* description */}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field /><Field />
            </div>
            <Field />
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <Sk className="h-5 w-20 rounded" />
            <Sk className="h-40 rounded-xl" />
          </div>
        </div>

        {/* Right col — meta */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <Sk className="h-5 w-20 rounded" />
            <Field />{/* category */}
            <Field />{/* stock */}
            <div className="flex items-center gap-3 pt-1">
              <Sk className="h-5 w-9 rounded-full" />
              <Sk className="h-4 w-20 rounded" />
            </div>
          </div>

          <Sk className="h-11 w-full rounded-xl" />{/* Save button */}
        </div>
      </div>
    </main>
  );
}
