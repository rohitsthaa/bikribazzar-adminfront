/**
 * The NCM destination branch picked while confirming an order, kept for this browser session
 * so "Ship via NCM" opens with it selected. Per-viewer convenience only — never required.
 */
const key = (orderId: string) => `ncm-branch:${orderId}`;

export function rememberNcmBranch(orderId: string, branch: string) {
  try { sessionStorage.setItem(key(orderId), branch); } catch { /* storage unavailable */ }
}

export function recallNcmBranch(orderId: string): string {
  try { return sessionStorage.getItem(key(orderId)) ?? ''; } catch { return ''; }
}

/** Fired by the status buttons when "Shipped" is clicked on a store with NCM: the courier card
 *  opens its booking form instead of the order being marked shipped without a pickup. */
export const OPEN_NCM_BOOKING = 'ncm:open-booking';
