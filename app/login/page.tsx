'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(login, null);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-800 text-white text-lg font-bold rounded-2xl mb-4">
            ST
          </div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-stone-900">
            Soul Thread
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">Admin panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-7">
          <form action={action} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                autoFocus
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50 placeholder:text-stone-400"
                placeholder="Enter your password"
              />
            </div>

            {state?.error && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            <Submit />
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          &copy; {new Date().getFullYear()} Soul Thread
        </p>
      </div>
    </div>
  );
}
