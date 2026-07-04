import { withSentryConfig } from '@sentry/nextjs';

// Derive the image host from the configured API base URL so next/image always
// allows whatever host uploads are served from. The platform API host moved to
// api-store.helloworldnepal.com; read it from env rather than hardcoding.
function apiImageHostname() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
  if (base) {
    try { return new URL(base).hostname; } catch { /* fall through */ }
  }
  return 'api-store.helloworldnepal.com';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — required by ./Dockerfile to self-host on the VPS.
  // Has no effect on a Vercel build.
  output: 'standalone',
  images: {
    remotePatterns: [
      // Platform API host (current)
      { protocol: 'https', hostname: 'api-store.helloworldnepal.com', pathname: '/uploads/**' },
      // Derived from the configured API base URL (per-deployment safety net)
      { protocol: 'https', hostname: apiImageHostname(), pathname: '/uploads/**' },
      // Soul Thread's own / legacy API host
      { protocol: 'https', hostname: 'api.soulthreadktm.com', pathname: '/uploads/**' },
      // Demo / placeholder images (picsum.photos used in seed-demo)
      { protocol: 'https', hostname: 'picsum.photos' },
      // Local development
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'api', port: '3000', pathname: '/uploads/**' },
    ],
  },
};

// Source map upload only runs if SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN are
// all set (e.g. in Vercel env vars); otherwise the plugin quietly no-ops instead
// of failing the build, so this is safe to leave on unconditionally.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  widenClientFileUpload: false,
});
