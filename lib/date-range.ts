/** Shared preset ranges for Finance and Dashboard — keeps range vocabulary/labels
 * consistent across both surfaces instead of each page inventing its own. */
export const FINANCE_RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '12m', label: '12 months' },
  { key: 'ytd', label: 'Year to date' },
] as const;

export type FinanceRangeKey = (typeof FINANCE_RANGES)[number]['key'];

export function parseFinanceRange(value: string | undefined): FinanceRangeKey {
  return FINANCE_RANGES.some((r) => r.key === value) ? (value as FinanceRangeKey) : '30d';
}

/** Bucket granularity naturally follows the range: day-by-day for short windows,
 * month-by-month once it's wide enough that daily bars would be unreadable. */
export function financeRangeToParams(range: FinanceRangeKey): { from: Date; to: Date; groupBy: 'day' | 'month' } {
  const now = new Date();
  switch (range) {
    case '7d':
      return { from: new Date(now.getTime() - 7 * 86400000), to: now, groupBy: 'day' };
    case '12m':
      return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to: now, groupBy: 'month' };
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1), to: now, groupBy: 'month' };
    case '30d':
    default:
      return { from: new Date(now.getTime() - 30 * 86400000), to: now, groupBy: 'day' };
  }
}

/** Custom from/to (YYYY-MM-DD strings from a date input) — groupBy inferred from span.
 * Parsed as explicit UTC (not local time): a bare "2026-01-01T00:00:00" parses in the
 * server's local timezone, and ANY non-zero UTC offset (ahead or behind) then shifts
 * the resulting instant onto a different UTC calendar day once .toISOString() truncates
 * it back to YYYY-MM-DD — every date in this app is otherwise UTC (ISO strings to/from
 * the API), so this keeps that consistent regardless of the server's local timezone. */
export function customRangeToParams(from: string, to?: string): { from: Date; to: Date; groupBy: 'day' | 'month' } {
  const fromDate = new Date(from + 'T00:00:00Z');
  const toDate = to ? new Date(to + 'T23:59:59Z') : new Date();
  const days = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000));
  return { from: fromDate, to: toDate, groupBy: days > 62 ? 'month' : 'day' };
}

export function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
