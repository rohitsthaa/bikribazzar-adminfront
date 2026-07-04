// Sentry — browser-side error tracking for the admin console.
// Disabled automatically when SENTRY_DSN is unset — same "skip if not configured"
// pattern as the API (see bikribazzar-api/Program.cs) and the storefront's other
// optional integrations.
// Uses NEXT_PUBLIC_SENTRY_DSN (not a secret — DSNs are meant to be public,
// same as any client-side error reporting key) so Next.js inlines it into the
// browser bundle at build time.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  // Session replay is overkill for a small internal admin panel; skip it to
  // keep the client bundle lean per the project's "keep bundle size lean" rule.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  enabled: Boolean(dsn),
});

console.log(dsn ? '[sentry] enabled (client)' : '[sentry] disabled — NEXT_PUBLIC_SENTRY_DSN not set (client)');
