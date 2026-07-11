'use client';
import { useRef, useState } from 'react';
import MarkdownContent from './MarkdownContent';

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** Fires on every change with the current text — lets a parent (e.g. a
   *  full-post preview) stay in sync without turning this into a controlled
   *  input (the underlying textarea still owns `name`/form submission). */
  onChange?: (value: string) => void;
}

export default function MarkdownEditor({ name, defaultValue, placeholder, rows = 8, className, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(defaultValue ?? '');
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    onChange?.(e.target.value);
  }

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
    { label: '• List', title: 'Bullet list', action: () => wrap('\n- ') },
    { label: '1. List', title: 'Numbered list', action: () => wrap('\n1. ') },
    { label: '“ ”', title: 'Quote', action: () => wrap('\n> ') },
    { label: '—', title: 'Divider', action: () => wrap('\n\n---\n\n') },
    { label: 'Link', title: 'Link', action: () => wrap('[', '](https://)') },
    { label: 'Image', title: 'Image', action: () => wrap('![', '](https://)') },
  ];

  return (
    <div className={`rounded-lg border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#c96a3a]/30 focus-within:border-[#c96a3a]/60 ${className ?? ''}`}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-stone-100 bg-stone-50 flex-wrap">
        {mode === 'write' && tools.map((t) => (
          <button key={t.label} type="button" title={t.title} onClick={t.action}
            className="px-2 py-0.5 rounded text-xs font-medium text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors">
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'write' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'preview' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Preview
          </button>
        </div>
      </div>
      {mode === 'write' ? (
        <textarea
          ref={ref}
          name={name}
          value={text}
          onChange={handleInput}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2.5 text-sm text-stone-800 focus:outline-none resize-y font-mono leading-relaxed bg-white"
        />
      ) : (
        <>
          {/* Keeps the field submitting even while a preview is showing. */}
          <input type="hidden" name={name} value={text} />
          <div className="px-4 py-3 bg-white" style={{ minHeight: `${rows * 1.6}em` }}>
            {text.trim() ? (
              <MarkdownContent content={text} />
            ) : (
              <p className="text-sm text-stone-300 italic">Nothing to preview yet — switch to Write and add some content.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
