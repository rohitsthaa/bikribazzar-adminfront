'use client';
import { useFormStatus } from 'react-dom';
import type { MouseEvent } from 'react';

interface SubmitButtonProps {
  label?: string;
  pendingLabel?: string;
  className?: string;
  // Fires on click, before the native submit. A caller can preventDefault()
  // here to intercept — e.g. ProductForm.tsx uses this to check validity
  // itself first, since a required field hidden on an inactive tab makes
  // the browser's own submit-time validation abort silently with no visible
  // error (it can't focus a display:none control to show its message).
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Drop-in submit button that shows a sliding progress bar while the
 * form's server action is running. Must be rendered inside a <form>.
 */
export default function SubmitButton({
  label = 'Save changes',
  pendingLabel = 'Saving…',
  className,
  onClick,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className={
        className ??
        'relative overflow-hidden rounded-xl bg-stone-800 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
      }
    >
      {/* sliding progress bar */}
      {pending && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-white/40 origin-left animate-progress"
        />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
