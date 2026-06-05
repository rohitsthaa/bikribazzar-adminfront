'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
    >
      {pending ? 'Adding…' : '+ Add'}
    </button>
  );
}

export default function AddGalleryForm({
  action,
}: {
  action: (state: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
}) {
  const [state, formAction] = useFormState(action, null);
  const [url, setUrl] = useState('');

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
        <ImageUploader value={url} onChange={setUrl} />
        {/* hidden input so the server action can read the URL */}
        <input type="hidden" name="url" value={url} />
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Alt text</label>
          <input
            name="alt"
            placeholder="Macramé shelf on white wall"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort order</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <Submit />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
