'use client';

import { useState } from 'react';

/**
 * Colour picker + hex text field pair that stay in sync.
 * Supports two modes:
 *  - Controlled: pass `value` + `onChange` (used by TemplateThemeClient)
 *  - Uncontrolled: pass `defaultValue` (legacy form-action usage)
 */
export default function ColorInput({
  name,
  label,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  // Internal state only used in uncontrolled mode
  const isControlled = controlledValue !== undefined;
  const initial = defaultValue || '';
  const [internalValue, setInternalValue] = useState(initial);

  const value = isControlled ? controlledValue : internalValue;
  const handleChange = (v: string) => {
    if (isControlled) {
      onChange?.(v);
    } else {
      setInternalValue(v);
    }
  };

  // For colour picker, only show it when we have a valid hex
  const pickerValue = /^#[0-9a-fA-F]{3,6}$/.test(value) ? value : (placeholder || '#ffffff');

  return (
    <div>
      <p className="text-xs font-medium text-stone-600 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={`${label} colour picker`}
          className="h-9 w-10 rounded-lg border border-stone-200 p-0.5 cursor-pointer bg-white flex-shrink-0"
        />
        <input
          type="text"
          name={isControlled ? undefined : name}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder ?? '#ffffff'}
          className="flex-1 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
        />
      </div>
    </div>
  );
}
