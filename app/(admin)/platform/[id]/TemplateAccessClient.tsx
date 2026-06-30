'use client';

import { useState, useTransition } from 'react';
import type { TemplateMeta } from '@/lib/api';
import { updateAllowedTemplatesAction } from '../actions';

interface Props {
  storeId: string;
  allTemplates: TemplateMeta[];
  /** null = unrestricted; string[] = explicit allowlist */
  initialAllowed: string[] | null;
}

export default function TemplateAccessClient({ storeId, allTemplates, initialAllowed }: Props) {
  const [mode, setMode] = useState<'unrestricted' | 'custom'>(
    initialAllowed === null ? 'unrestricted' : 'custom'
  );
  const [checked, setChecked] = useState<Set<string>>(
    new Set(initialAllowed ?? allTemplates.filter((t) => t.access !== 'private').map((t) => t.id))
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setStatus('saving');
    setErrorMsg('');
    const payload = mode === 'unrestricted' ? null : Array.from(checked);
    startTransition(async () => {
      const result = await updateAllowedTemplatesAction(storeId, payload);
      if ('error' in result) {
        setStatus('error');
        setErrorMsg(result.error);
      } else {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2500);
      }
    });
  }

  const publicTemplates = allTemplates.filter((t) => t.access !== 'private');
  const privateTemplates = allTemplates.filter((t) => t.access === 'private');

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="accessMode"
            checked={mode === 'unrestricted'}
            onChange={() => setMode('unrestricted')}
            className="mt-1 accent-[#c96a3a]"
          />
          <div>
            <p className="text-sm font-medium text-stone-800">Unrestricted</p>
            <p className="text-xs text-stone-400">Store can choose any public template. No private templates granted.</p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="accessMode"
            checked={mode === 'custom'}
            onChange={() => setMode('custom')}
            className="mt-1 accent-[#c96a3a]"
          />
          <div>
            <p className="text-sm font-medium text-stone-800">Custom list</p>
            <p className="text-xs text-stone-400">Restrict this store to a specific set of templates. Required to grant exclusive/private themes.</p>
          </div>
        </label>
      </div>

      {/* Checklist — only shown in custom mode */}
      {mode === 'custom' && (
        <div className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
          {/* Public templates */}
          {publicTemplates.map((t) => (
            <label key={t.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 transition-colors">
              <input
                type="checkbox"
                checked={checked.has(t.id)}
                onChange={() => toggle(t.id)}
                className="accent-[#c96a3a] rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800">{t.name}</p>
                <p className="text-xs text-stone-400">{t.tagline}</p>
              </div>
              <div className="flex gap-1">
                {t.palette.slice(0, 3).map((color) => (
                  <span
                    key={color}
                    className="w-4 h-4 rounded-full border border-stone-200 flex-shrink-0"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </label>
          ))}

          {/* Private templates */}
          {privateTemplates.length > 0 && (
            <>
              <div className="px-4 py-2 bg-stone-50">
                <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Exclusive / private</p>
              </div>
              {privateTemplates.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-amber-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={checked.has(t.id)}
                    onChange={() => toggle(t.id)}
                    className="accent-[#c96a3a] rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-800">{t.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Private</span>
                    </div>
                    <p className="text-xs text-stone-400">{t.tagline}</p>
                  </div>
                  <div className="flex gap-1">
                    {t.palette.slice(0, 3).map((color) => (
                      <span
                        key={color}
                        className="w-4 h-4 rounded-full border border-stone-200 flex-shrink-0"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </label>
              ))}
            </>
          )}

          {privateTemplates.length === 0 && (
            <div className="px-4 py-3 bg-stone-50 text-center">
              <p className="text-xs text-stone-400">No private templates in registry yet. Add one in <code className="bg-stone-100 px-1 rounded">soul-thread-api/src/routes/templates.ts</code>.</p>
            </div>
          )}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending || status === 'saving'}
          className="rounded-xl bg-stone-800 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save access'}
        </button>
        {status === 'saved' && (
          <span className="text-xs text-emerald-600 font-medium">Saved</span>
        )}
        {status === 'error' && (
          <span className="text-xs text-red-600">{errorMsg}</span>
        )}
      </div>
    </div>
  );
}
