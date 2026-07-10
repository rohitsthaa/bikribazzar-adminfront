'use client';
import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Testimonial } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

type AddAction = (prev: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
type EditAction = (id: number, prev: unknown, formData: FormData) => Promise<{ error?: string; ok?: boolean } | undefined>;
type RemoveAction = (id: number) => Promise<void>;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-stone-700 disabled:opacity-50 transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-stone-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

function AddForm({ action }: { action: AddAction }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="bg-white border border-stone-200 rounded-2xl px-6 py-5 mb-8">
      <h2 className="text-sm font-semibold text-stone-700 mb-4">Add testimonial</h2>
      {state?.error && (
        <p className="text-red-600 text-xs mb-3">{state.error}</p>
      )}
      <div className="space-y-3">
        <textarea
          name="quote"
          required
          rows={3}
          placeholder="What the customer said…"
          className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 resize-none"
        />
        <div className="flex gap-3">
          <input
            name="author"
            required
            placeholder="Customer name"
            className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
          />
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            placeholder="Sort"
            className="w-20 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
          />
        </div>
        <SubmitButton label="+ Add" pendingLabel="Adding…" />
      </div>
    </form>
  );
}

function TestimonialRow({
  testimonial,
  editAction,
  removeAction,
}: {
  testimonial: Testimonial;
  editAction: EditAction;
  removeAction: RemoveAction;
}) {
  const [editing, setEditing] = useState(false);
  const boundEdit = editAction.bind(null, testimonial.id);
  const [state, formAction] = useActionState(boundEdit, null);

  // Close edit form when save succeeds
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <li className="bg-white border border-stone-200 rounded-2xl px-5 py-4">
        <form action={formAction} className="space-y-3">
          {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
          <textarea
            name="quote"
            required
            rows={3}
            defaultValue={testimonial.quote}
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 resize-none"
          />
          <div className="flex gap-3">
            <input
              name="author"
              required
              defaultValue={testimonial.author}
              className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
            <input
              name="sortOrder"
              type="number"
              defaultValue={testimonial.sortOrder}
              className="w-20 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
            />
          </div>
          <div className="flex gap-2">
            <SaveButton />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="bg-stone-100 text-stone-600 text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="bg-white border border-stone-200 rounded-2xl px-5 py-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800 leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <p className="mt-2 text-xs text-stone-500">— {testimonial.author}</p>
        {testimonial.sortOrder !== 0 && (
          <p className="mt-1 text-[11px] text-stone-400">Sort: {testimonial.sortOrder}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-stone-500 hover:text-stone-900 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
        >
          Edit
        </button>
        <form action={removeAction.bind(null, testimonial.id)}>
          <button
            type="submit"
            className="text-xs font-medium text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Remove
          </button>
        </form>
      </div>
    </li>
  );
}

export default function TestimonialsClient({
  testimonials,
  addAction,
  editAction,
  removeAction,
}: {
  testimonials: Testimonial[];
  addAction: AddAction;
  editAction: EditAction;
  removeAction: RemoveAction;
}) {
  return (
    <div>
      <AddForm action={addAction} />
      {testimonials.length === 0 ? (
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 0 1 0z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4z"/>
            </svg>
          }
          title="No testimonials yet"
          body="Add one above — it'll show up on the storefront."
        />
      ) : (
        <ul className="space-y-3">
          {testimonials.map((t) => (
            <TestimonialRow
              key={t.id}
              testimonial={t}
              editAction={editAction}
              removeAction={removeAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
