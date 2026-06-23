'use client';

import { useState } from 'react';

/** A colour picker + hex text field pair that stay in sync. */
export default function ColorInput({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const initial = defaultValue || placeholder || '#ffffff';
  const [value, setValue] = useState(initial.startsWith('#') ? initial : '#ffffff');

  return (
    <div>
      <p className="text-xs font-medium text-stone-600 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`${label} colour picker`}
          className="h-9 w-10 rounded-lg border border-stone-200 p-0.5 cursor-pointer bg-white flex-shrink-0"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? '#ffffff'}
          className="flex-1 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
        />
      </div>
    </div>
  );
}
