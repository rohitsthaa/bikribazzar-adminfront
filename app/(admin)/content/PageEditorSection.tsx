"use client";

import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30";
export const btnCls =
  "rounded-lg bg-[#c96a3a] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b85f33] disabled:opacity-50";

export function PageEditorSection({
  title,
  hint,
  enabled,
  onToggle,
  pending,
  saved,
  children,
}: {
  title: string;
  hint?: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  pending: boolean;
  saved: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-stone-900">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <span className="w-14 text-right text-xs text-stone-400">
            {pending ? "Saving…" : saved ? <span className="text-emerald-600">Saved ✓</span> : enabled ? "Visible" : "Hidden"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`${title} storefront visibility`}
            disabled={pending}
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-[#c96a3a]" : "bg-stone-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
