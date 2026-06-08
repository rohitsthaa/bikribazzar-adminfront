function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

function Field({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && <Sk className="h-3.5 w-20 rounded" />}
      <Sk className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function NewOrderLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <Sk className="h-8 w-28 rounded-xl mb-1.5" />
        <Sk className="h-4 w-64 rounded" />
      </div>

      <div className="space-y-6">
        {/* Customer section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <Sk className="h-5 w-24 rounded" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field /><Field /><Field /><Field />
          </div>
          <Field />
        </div>

        {/* Items section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <Sk className="h-5 w-16 rounded" />
          {[0, 1].map((i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-16 rounded" />
                <Sk className="h-10 rounded-lg" />
              </div>
              <div className="w-24 space-y-1.5">
                <Sk className="h-3.5 w-12 rounded" />
                <Sk className="h-10 rounded-lg" />
              </div>
              <Sk className="h-10 w-10 rounded-lg flex-shrink-0" />
            </div>
          ))}
          <Sk className="h-9 w-28 rounded-lg" />
        </div>

        {/* Delivery + notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <Sk className="h-5 w-28 rounded" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field /><Field />
          </div>
          <Field />
        </div>

        {/* Submit */}
        <Sk className="h-11 w-full rounded-xl" />
      </div>
    </main>
  );
}
