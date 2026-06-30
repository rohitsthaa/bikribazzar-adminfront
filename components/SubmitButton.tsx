'use client';
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  label?: string;
  pendingLabel?: string;
  className?: string;
}

/**
 * Drop-in submit button that shows a sliding progress bar while the
 * form's server action is running. Must be rendered inside a <form>.
 */
export default function SubmitButton({
  label = 'Save changes',
  pendingLabel = 'Saving…',
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
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
