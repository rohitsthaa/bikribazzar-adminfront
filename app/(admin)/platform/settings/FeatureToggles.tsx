'use client';

import { useState, useTransition } from 'react';
import { setPlatformFeaturesAction } from '../actions';

const LABELS: Record<string, { label: string; hint: string }> = {
  content:   { label: 'Content',   hint: 'Site copy and page content' },
  blog:      { label: 'Blog',      hint: 'Posts and categories' },
  portfolio: { label: 'Portfolio', hint: 'Portfolio-type stores only' },
  services:  { label: 'Services',  hint: 'Business-type stores only' },
  gallery:   { label: 'Gallery',   hint: 'Site-wide photo showcase' },
  design:    { label: 'Design',    hint: 'Template and theme editor' },
};
const GATEWAY_LABELS: Record<string, { label: string; hint: string }> = {
  payments_esewa: { label: 'eSewa', hint: 'Allow eSewa checkout across stores' },
  payments_khalti: { label: 'Khalti', hint: 'Allow Khalti checkout across stores' },
  payments_fonepay: { label: 'Fonepay', hint: 'Allow Fonepay checkout across stores' },
};

/**
 * Platform-wide feature switches. Off hides the area from EVERY store's admin nav and blocks
 * writes to it at the API — this is not a per-store or per-plan control, unlike the payment
 * gateways on the plans screen.
 */
export default function FeatureToggles({ initial }: { initial: Record<string, boolean> }) {
  const [features, setFeatures] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  function toggle(key: string, next: boolean) {
    const previous = features;
    setFeatures({ ...features, [key]: next });   // optimistic
    setError('');
    start(async () => {
      const result = await setPlatformFeaturesAction({ [key]: next });
      if (!result.ok) {
        setFeatures(previous);                   // put it back; the switch didn't take
        setError(result.error);
      }
    });
  }

  const offCount = Object.keys(LABELS).filter((key) => features[key] === false).length;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-stone-800">Feature availability</h2>
      <p className="mt-1 text-xs text-stone-500">
        Turn an area off while it isn&apos;t being worked on. It disappears from every
        store&apos;s admin navigation and the API rejects writes to it. Existing data is kept
        and reappears untouched when the area is switched back on.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Object.keys(LABELS).map((key) => {
          const on = features[key] !== false;
          return (
            <label
              key={key}
              className="flex items-start gap-2.5 rounded-lg border border-stone-200 px-3 py-2.5 hover:bg-stone-50"
            >
              <input
                type="checkbox"
                checked={on}
                disabled={pending}
                onChange={(e) => toggle(key, e.target.checked)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className={`block text-xs font-medium ${on ? 'text-stone-800' : 'text-stone-400'}`}>
                  {LABELS[key].label}
                </span>
                <span className="block text-[11px] text-stone-400">{LABELS[key].hint}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-7 border-t border-stone-100 pt-5">
        <h3 className="text-sm font-semibold text-stone-800">Payment gateway availability</h3>
        <p className="mt-1 text-xs text-stone-500">
          These platform-wide switches control whether stores can offer each gateway. Turning one off
          blocks checkout and overrides plan access and per-store allowances. Store credentials remain saved.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {Object.entries(GATEWAY_LABELS).map(([key, meta]) => {
            const on = features[key] !== false;
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-3"
              >
                <span className="min-w-0">
                  <span className={`block text-xs font-medium ${on ? 'text-stone-800' : 'text-stone-400'}`}>
                    {meta.label}
                  </span>
                  <span className="block text-[11px] text-stone-400">{meta.hint}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-label={`${meta.label} platform availability`}
                  aria-checked={on}
                  disabled={pending}
                  onClick={() => toggle(key, !on)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-wait disabled:opacity-60 ${on ? 'bg-indigo-600' : 'bg-stone-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {offCount > 0 && !error && (
        <p className="mt-3 text-[11px] text-amber-700">
          {offCount} area{offCount !== 1 ? 's are' : ' is'} hidden from every store. Store owners
          see no explanation for the missing nav entries, so tell them if it matters.
        </p>
      )}
    </section>
  );
}
