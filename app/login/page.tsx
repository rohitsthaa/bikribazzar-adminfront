'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Soul Thread</h1>
          <p className="text-sm text-gray-500 mt-1">Admin panel</p>
        </div>
        <form action={action} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <Submit />
        </form>
      </div>
    </div>
  );
}
