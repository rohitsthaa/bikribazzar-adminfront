// Browser-bundle shim: lib/ modules read process.env.* at module scope
// (Next.js provides this; a plain esbuild IIFE does not). Imported first by
// .ds-entry.ts so it runs before any dependent module evaluates.
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = { env: {} };
}
export {};
