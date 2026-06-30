import { redirect } from 'next/navigation';
import { setAuthCookieAction } from '../signup/actions';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function verifyToken(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/self-serve/verify-email?token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Verification failed.' };
    // Set the JWT cookie via server action
    await setAuthCookieAction(data.token);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? '';

  if (!token) {
    return <ErrorScreen message="No verification token found. Please use the link from your email." />;
  }

  const result = await verifyToken(token);

  if (result.ok) {
    redirect('/');
  }

  return <ErrorScreen message={result.error} />;
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-5">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-semibold text-stone-900">Verification failed</h1>
          <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
          <div className="space-y-3 pt-2">
            <a
              href="/signup"
              className="block w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-sm font-medium transition-colors text-center"
            >
              Sign up again
            </a>
            <a
              href="/login"
              className="block w-full py-2.5 px-4 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-medium transition-colors text-center"
            >
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
