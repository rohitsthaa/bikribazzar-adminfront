'use client';
import { useRef } from 'react';

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function MarkdownEditor({ name, defaultValue, placeholder, rows = 8, className }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrap(before: string, after = '') {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const replacement = before + selected + after;
    const newVal = el.value.slice(0, start) + replacement + el.value.slice(end);
    // Trigger React-compatible update
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(el, newVal);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
    el.setSelectionRange(start + before.length + selected.length + after.length, start + before.length + selected.length + after.length);
  }

  const tools: Array<{ label: string; title: string; action: () => void }> = [
    { label: 'B', title: 'Bold', action: () => wrap('**', '**') },
    { label: 'I', title: 'Italic', action: () => wrap('_', '_') },
    { label: 'H2', title: 'Heading', action: () => wrap('\n## ') },
    { label: 'H3', title: 'Sub-heading', action: () => wrap('\n### ') },
    { label: '• List', title: 'List item', action: () => wrap('\n- ') },
    { label: '—', title: 'Divider', action: () => wrap('\n\n---\n\n') },
    { label: 'Link', title: 'Link', action: () => wrap('[', '](https://)') },
  ];

  return (
    <div className={`rounded-lg border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#c96a3a]/30 focus-within:border-[#c96a3a]/60 ${className ?? ''}`}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-stone-100 bg-stone-50 flex-wrap">
        {tools.map((t) => (
          <button key={t.label} type="button" title={t.title} onClick={t.action}
            className="px-2 py-0.5 rounded text-xs font-medium text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors">
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-stone-400">Markdown supported</span>
      </div>
      <textarea ref={ref} name={name} defaultValue={defaultValue} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 text-sm text-stone-800 focus:outline-none resize-y font-mono leading-relaxed bg-white" />
    </div>
  );
}
