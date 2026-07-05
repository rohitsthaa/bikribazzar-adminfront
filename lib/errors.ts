/**
 * Turns a caught error into something safe to show a non-technical user.
 *
 * `apiFetch` (lib/api.ts) throws `Error("API /path → 500: <raw response body>")`
 * on any non-OK response — that raw body can be an HTML error page, a stack
 * trace, or a JSON validation message meant for end users. The naive
 * `err instanceof Error ? err.message : fallback` pattern used across the
 * admin's actions.ts files surfaces that raw dump verbatim whenever the
 * error IS an Error instance, which apiFetch failures always are. This
 * unwraps that shape properly instead:
 *   - a JSON body with an `error`/`message` field (the API's own
 *     human-readable validation message, e.g. "That domain is already in
 *     use by another store.") is shown as-is
 *   - 401/403/404 get a short generic message
 *   - anything else unparseable (5xx, HTML, etc.) falls back to a generic
 *     "something went wrong" message rather than leaking the raw dump
 *   - errors NOT from apiFetch (e.g. a permission check throwing
 *     `new Error('Not allowed.')`) are already short and written by us,
 *     so they're shown as-is
 */
const API_ERROR_PATTERN = /^API (.+?) → (\d+): ([\s\S]*)$/;

export function friendlyApiError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(err instanceof Error)) return fallback;

  const match = err.message.match(API_ERROR_PATTERN);
  if (!match) return err.message;

  const [, , statusStr, body] = match;
  const status = Number(statusStr);

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.error === 'string' && parsed.error) return parsed.error;
    if (typeof parsed?.message === 'string' && parsed.message) return parsed.message;
  } catch {
    // Body wasn't JSON (HTML error page, plain text, etc.) — fall through.
  }

  if (status === 401 || status === 403) return "You don't have permission to do that.";
  if (status === 404) return "That couldn't be found — it may have already been removed.";
  if (status >= 400 && status < 500) return fallback;
  return 'Something went wrong on our end. Try again in a moment.';
}
