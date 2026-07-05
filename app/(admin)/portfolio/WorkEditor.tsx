'use client';
import { useState, useTransition } from 'react';
import type { PortfolioWork } from '@/lib/api';
import { createWorkAction, updateWorkAction } from './actions';
import MarkdownEditor from '@/components/MarkdownEditor';
import ImageUploader from '@/components/ImageUploader';

const inputCls = 'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

interface Props {
  work?: PortfolioWork;
  onSave: (work: PortfolioWork) => void;
  onCancel: () => void;
}

export default function WorkEditor({ work, onSave, onCancel }: Props) {
  const isNew = !work;
  const [title, setTitle] = useState(work?.title ?? '');
  const [slug, setSlug] = useState(work?.slug ?? '');
  const [medium, setMedium] = useState(work?.medium ?? '');
  const [year, setYear] = useState(work?.year ?? '');
  const [images, setImages] = useState<string[]>(work?.images ?? []);
  const [tags, setTags] = useState((work?.tags ?? []).join(', '));
  const [priceLabel, setPriceLabel] = useState(work?.priceLabel ?? '');
  const [available, setAvailable] = useState(work?.available ?? true);
  const [sortOrder, setSortOrder] = useState(work?.sortOrder ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const description = fd.get('description') as string ?? '';
    const data: Partial<PortfolioWork> = {
      title,
      slug: slug || undefined,
      medium,
      year,
      description,
      images: images.filter(Boolean),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      priceLabel,
      available,
      sortOrder,
    };
    start(async () => {
      const res = isNew
        ? await createWorkAction(data)
        : await updateWorkAction(work!.id, data);
      if (res.error) { setError(res.error); return; }
      if (res.work) onSave(res.work);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Work title" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Slug <span className="text-stone-400 font-normal">(auto-generated if blank)</span></label>
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="work-slug" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Sort order</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Medium</label>
          <input value={medium} onChange={e => setMedium(e.target.value)} placeholder="Oil on canvas" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Year</label>
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
        <MarkdownEditor name="description" defaultValue={work?.description} placeholder="Describe this work…" rows={8} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Images</label>
        <div className="space-y-3">
          {images.map((url, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <ImageUploader
                  value={url}
                  onChange={(newUrl) => setImages(images.map((u, j) => (j === i ? newUrl : u)))}
                />
              </div>
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="shrink-0 mt-2 p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setImages([...images, ''])}
            className="w-full max-w-sm py-2 border-2 border-dashed border-stone-200 rounded-xl text-xs text-stone-400 hover:border-[#c96a3a]/40 hover:text-[#c96a3a] transition-colors"
          >
            + Add image
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Price label</label>
          <input value={priceLabel} onChange={e => setPriceLabel(e.target.value)} placeholder="NPR 15,000 or Price on request" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Tags <span className="text-stone-400 font-normal">(comma-separated)</span></label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="painting, abstract" className={inputCls} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="available" checked={available} onChange={e => setAvailable(e.target.checked)} className="rounded" />
        <label htmlFor="available" className="text-sm text-stone-600">Available / visible on storefront</label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
        <button type="submit" disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] disabled:opacity-50 transition-colors">
          {isPending ? 'Saving…' : isNew ? 'Add work' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
