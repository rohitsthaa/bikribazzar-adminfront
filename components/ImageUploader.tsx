'use client';
import { useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function ImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      onChange(json.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }

  return (
    // Capped at max-w-sm: the 16:9 drop zone below scales with this wrapper's
    // width, and this component gets reused in both narrow sidebars (product
    // image rail) and full-width form cards (Gallery's "Add Image", Settings).
    // Without a cap, the same box that's a sensible ~140px tall in a 260px
    // sidebar stretches to 600px+ tall in a 1000px-wide card — a huge empty
    // rectangle for what's meant to be a compact upload control.
    <div className="space-y-3 max-w-sm">
      {/* Drop zone / preview */}
      <div
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full rounded-xl border-2 transition-all overflow-hidden ${
          value
            ? 'border-gray-200 cursor-default'
            : dragging
            ? 'border-stone-400 bg-stone-50 cursor-copy'
            : 'border-dashed border-gray-300 bg-gray-50 hover:border-stone-400 hover:bg-stone-50 cursor-pointer'
        }`}
        style={{ aspectRatio: '16/9' }}
      >
        {value ? (
          <>
            {/* Route through the /api/image proxy (like the product cards) so the
                preview resolves against the current API host regardless of what
                host the URL was stored with. A raw <img src={value}> breaks when
                the stored URL points at an old/different API host. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/image?src=${encodeURIComponent(value)}`} alt="Product preview" className="w-full h-full object-cover" />
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="px-3 py-2 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                className="px-3 py-2 bg-white/20 text-white text-xs font-medium rounded-lg hover:bg-white/30 transition-colors"
              >
                Remove
              </button>
            </div>
          </>
        ) : uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Drop image here</p>
              <p className="text-xs text-gray-400">or click to browse · JPG, PNG, WebP</p>
            </div>
          </div>
        )}
      </div>

      {/* URL row — compact when image is set, full paste input when empty */}
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-stone-500 flex-1 truncate font-mono">
            {value.split('/').pop()}
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-stone-500 hover:text-stone-900 whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            Replace
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-gray-600"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 border border-gray-300 hover:border-stone-400 rounded-lg text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            ↑ Upload
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
