'use client';

/**
 * Card + labelled text input shared by the Settings pages.
 *
 * Extracted when /settings was split into Store profile and Payments: both needed the same
 * card chrome, and a second copy would have drifted the moment one page changed.
 *
 * One card == one save button, deliberately. A single Save for an entire page of unrelated
 * settings makes it unclear what a click is about to write.
 */
export function SettingCard({
  title,
  description,
  children,
  onSave,
  isPending,
  saved,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  isPending: boolean;
  saved: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      {children}
      <div className="flex items-center justify-between pt-2">
        <span className={`text-xs font-medium transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
          ✓ Saved
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="relative overflow-hidden px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-colors font-medium"
        >
          {isPending && (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[3px] bg-white/40 origin-left animate-progress"
            />
          )}
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, mono, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300 ${mono ? 'font-mono tracking-wide' : ''}`}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, hint, rows = 3 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
