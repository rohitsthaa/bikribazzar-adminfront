'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { addMaterial } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap inline-flex items-center gap-2"
    >
      {pending && (
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
        </svg>
      )}
      {pending ? 'Adding…' : '+ Add'}
    </button>
  );
}

export default function AddMaterialForm() {
  const [state, action] = useFormState(addMaterial, null);

  return (
    <form action={action}>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Label</label>
          <input
            name="label"
            required
            placeholder="e.g. Natural cotton cord"
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Sort order</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>
        <Submit />
      </div>
      {state?.error && <p className="text-sm text-red-600 mt-2">{state.error}</p>}
    </form>
  );
}
