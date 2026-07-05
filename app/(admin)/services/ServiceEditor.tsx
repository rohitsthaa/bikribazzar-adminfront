'use client';
import { useState, useTransition } from 'react';
import type { Service } from '@/lib/api';
import { createServiceAction, updateServiceAction } from './actions';
import MarkdownEditor from '@/components/MarkdownEditor';
import ImageUploader from '@/components/ImageUploader';

const inputCls = 'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

interface Props {
  service?: Service;
  onSave: (service: Service) => void;
  onCancel: () => void;
}

export default function ServiceEditor({ service, onSave, onCancel }: Props) {
  const isNew = !service;
  const [title, setTitle] = useState(service?.title ?? '');
  const [priceLabel, setPriceLabel] = useState(service?.priceLabel ?? '');
  const [image, setImage] = useState(service?.image ?? '');
  const [tags, setTags] = useState((service?.tags ?? []).join(', '));
  const [available, setAvailable] = useState(service?.available ?? true);
  const [sortOrder, setSortOrder] = useState(service?.sortOrder ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const description = fd.get('description') as string ?? '';
    const data: Partial<Service> = {
      title, description, priceLabel, image,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      available, sortOrder,
    };
    start(async () => {
      const res = isNew
        ? await createServiceAction(data)
        : await updateServiceAction(service!.id, data);
      if (res.error) { setError(res.error); return; }
      if (res.service) onSave(res.service);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Service title" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
        <MarkdownEditor name="description" defaultValue={service?.description} placeholder="Describe this service…" rows={8} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Price label</label>
        <input value={priceLabel} onChange={e => setPriceLabel(e.target.value)} placeholder="From NPR 5,000 or Contact for pricing" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Image</label>
        <ImageUploader value={image} onChange={setImage} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Tags <span className="text-stone-400 font-normal">(comma-separated)</span></label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="design, development" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Sort order</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className={inputCls} />
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
          {isPending ? 'Saving…' : isNew ? 'Add service' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
