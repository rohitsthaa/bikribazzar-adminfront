// Next.js instrumentation hook — loads the right Sentry config for whichever
// runtime this admin app is executing in (Node server vs. Vercel Edge/middleware).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>) => {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
