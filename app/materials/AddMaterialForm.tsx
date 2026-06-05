'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { addMaterial } from './actions';

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

export default function AddMaterialForm() {
  const [state, action] = useFormState(addMaterial, null);

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
          <input
            name="label"
            required
            placeholder="e.g. Natural cotton cord"
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
