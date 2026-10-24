"use client";

import { useState, useTransition } from "react";
import { savePageVisibility } from "@/app/(admin)/content/actions";

type ManagedPage = "gallery" | "blog";

export default function PageVisibilityCard({
  page,
  initialEnabled,
  title,
  description,
}: {
  page: ManagedPage;
  initialEnabled: boolean;
  title: string;
  description: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await savePageVisibility(page, next);
      if (result.error) {
        setEnabled(!next);
        setError(result.error);
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-stone-900">{title}</h2>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-stone-500" aria-live="polite">
            {pending ? "Saving…" : saved ? "Saved" : enabled ? "Visible" : "Hidden"}
          </span>
          <button
            type="button"
            role="switch"
            aria-label={`Show ${title.toLowerCase()} on storefront`}
            aria-checked={enabled}
            disabled={pending}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-[#c96a3a]" : "bg-stone-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
