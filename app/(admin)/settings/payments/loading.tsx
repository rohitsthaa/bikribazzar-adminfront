export default function Loading() {
  return (
    <main className="p-6 md:p-8 max-w-3xl animate-pulse">
      <div className="mb-6 h-8 w-32 rounded bg-stone-100" />
      <div className="mb-6 h-9 w-72 rounded bg-stone-100" />
      <div className="space-y-5">
        <div className="h-48 rounded-2xl bg-stone-100" />
        <div className="h-96 rounded-2xl bg-stone-100" />
      </div>
    </main>
  );
}
