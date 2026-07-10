'use client';
import { useFormStatus } from 'react-dom';
import { useState, useActionState } from 'react';
import ImageUploader from '@/components/ImageUploader';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium whitespace-nowrap"
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
  const [state, formAction] = useActionState(action, null);
  const [url, setUrl] = useState('');

  const fieldLabel = 'block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide';
  const textInput =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/50';

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={fieldLabel}>Image</label>
        <ImageUploader value={url} onChange={setUrl} />
        {/* hidden input so the server action can read the URL */}
        <input type="hidden" name="url" value={url} />
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className={fieldLabel}>Alt text</label>
          <input
            name="alt"
            placeholder="Macramé shelf on white wall"
            className={textInput}
          />
          <p className="text-xs text-gray-400 mt-1">Shown to screen readers and search engines.</p>
        </div>
        <div className="w-24">
          <label className={fieldLabel}>Sort order</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className={`${textInput} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>
        <Submit />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      )}
    </form>
  );
}
