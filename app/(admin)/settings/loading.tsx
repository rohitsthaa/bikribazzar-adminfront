function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-lg ${className ?? ''}`} />;
}

function SettingCard({ rows = 1, hasImage = false }: { rows?: number; hasImage?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <div>
        <Sk className="h-5 w-32 rounded mb-1" />
        <Sk className="h-3.5 w-48 rounded" />
      </div>
      {hasImage && <Sk className="w-24 h-24 rounded-xl" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Sk className="h-3.5 w-20 rounded" />
          <Sk className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Sk className="h-9 w-24 rounded-xl" />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Sk className="h-8 w-24 rounded-xl mb-1" />
        <Sk className="h-4 w-52 rounded" />
      </div>
      <div className="space-y-5">
        <SettingCard hasImage rows={1} />
        <SettingCard rows={4} />
        <SettingCard rows={1} hasImage />
        <SettingCard rows={3} />
        <SettingCard rows={1} />
        <SettingCard rows={1} />
      </div>
    </main>
  );
}
