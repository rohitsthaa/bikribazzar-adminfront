// Sentry — edge runtime (middleware.ts) error tracking for the admin console.
// Same DSN as the client/server config; disabled automatically when unset.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  enabled: Boolean(dsn),
});
