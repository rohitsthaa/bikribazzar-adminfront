import { getPlatformFeatures } from './api';

/**
 * Platform → Settings → Feature availability, enforced on the admin server.
 *
 * Blog, Gallery, Portfolio and Services writes are also refused by the API (RequireFeature).
 * Content and Design have no API-side check — their writes are ordinary settings / store
 * updates the API can't tell apart — so the server actions check here. A failed lookup counts
 * as ON, the API's own rule.
 */
export async function assertFeatureOn(key: string): Promise<void> {
  const features = await getPlatformFeatures().catch(() => ({} as Record<string, boolean>));
  if (features[key] === false) throw new Error(`This area is turned off by the platform.`);
}
