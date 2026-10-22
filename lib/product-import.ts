// Parsing, coercion and validation for the product spreadsheet import.
//
// Lives here rather than inside CsvImportButton so the component is about UI and this is
// about data — and because these are pure functions with no React or Next coupling, which
// makes them the part worth testing if a runner is ever added to this app. Nothing here may
// import from '@/lib/api': that pulls in next/headers and breaks the client bundle.

import { slugify } from '@/lib/slug';

// ── Columns ───────────────────────────────────────────────────────────────────
// One definition, used for the template, the in-modal guide and the grid's headers. There
// used to be three parallel arrays (TEMPLATE_HEADERS / TEMPLATE_EXAMPLE / COLUMN_GUIDE)
// that could drift apart.

export type ImportField =
  | 'id' | 'name' | 'description' | 'priceNpr' | 'category'
  | 'details' | 'tag' | 'available' | 'stockQty' | 'reorderPoint';

export const COLUMNS: {
  key: ImportField;
  label: string;
  required: boolean;
  hint: string;
  example: string;
  /** Shown in the grid's main table; the rest sit behind the row's "more" toggle. */
  primary: boolean;
}[] = [
  { key: 'id', label: 'ID', required: false, primary: true,
    hint: 'Slug/SKU. Leave blank to auto-generate from the name. Re-importing the same id updates that product.',
    example: 'macrame-shelf-single' },
  { key: 'name', label: 'Name', required: true, primary: true,
    hint: 'Product title.', example: 'Single-Tier Hanging Shelf' },
  { key: 'priceNpr', label: 'Price', required: true, primary: true,
    hint: 'Whole rupees. "Rs 2,400" and "2400/-" are understood.', example: '2400' },
  { key: 'category', label: 'Category', required: false, primary: true,
    hint: 'Pick from your categories in the review step.', example: 'shelf' },
  { key: 'stockQty', label: 'Stock', required: false, primary: true,
    hint: 'Units in stock. Blank means unlimited.', example: '10' },
  { key: 'available', label: 'Visible', required: false, primary: true,
    hint: 'Whether it shows in the shop.', example: 'true' },
  { key: 'reorderPoint', label: 'Reorder at', required: false, primary: false,
    hint: 'Low-stock alert threshold. 0 = no alert.', example: '3' },
  { key: 'tag', label: 'Badge', required: false, primary: false,
    hint: 'Badge like "new" or "bestseller".', example: 'new' },
  { key: 'description', label: 'Description', required: false, primary: false,
    hint: 'Falls back to the name if blank.', example: 'Handwoven cotton cord shelf with natural pine' },
  { key: 'details', label: 'Details', required: false, primary: false,
    hint: 'Size / material line shown on the product page.', example: '30×15 cm · natural pine · cotton cord' },
];

export const PRIMARY_COLUMNS = COLUMNS.filter((c) => c.primary);
export const SECONDARY_COLUMNS = COLUMNS.filter((c) => !c.primary);

/** Refuse rather than hang the browser and blow the server-action body limit. */
export const MAX_ROWS = 500;

// ── CSV parsing ───────────────────────────────────────────────────────────────

/**
 * Parses an entire CSV in one pass.
 *
 * The previous implementation split the text on newlines and *then* parsed quotes within
 * each line, so a quoted field containing a line break — an ordinary multi-line product
 * description — was torn into separate rows and everything after it shifted. Quote state
 * has to span newlines, which means scanning the whole text, not line by line.
 */
export function parseCsv(text: string): string[][] {
  // A leading BOM is stripped by String.trim() (U+FEFF is ECMAScript whitespace), but
  // relying on that is subtle, and it only helps where trim() is actually called.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }  // escaped quote
        else inQuotes = false;
      } else if (ch === '\r' && src[i + 1] === '\n') {
        cell += '\n'; i++;                              // normalise CRLF inside a field
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') { inQuotes = true; }
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);

  // Drop blank lines AFTER parsing — doing it before is what required splitting on
  // newlines in the first place.
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function templateCsv(): string {
  return toCsv([COLUMNS.map((c) => c.key), COLUMNS.map((c) => c.example)]);
}

// ── Coercion ──────────────────────────────────────────────────────────────────
// A spreadsheet produces what a person typed, not what an API wants. Accepting these
// costs a few lines here and saves a round trip through the file for the merchant.

/** Devanagari digits, so a price typed in Nepali numerals isn't rejected outright. */
function asciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

export type NumResult =
  | { kind: 'blank' }
  | { kind: 'ok'; value: number }
  | { kind: 'bad'; reason: string };

/**
 * "Rs 2,400" / "2400/-" / "२४००" / " 2400 " all mean 2400.
 *
 * Whole rupees only: PriceNpr is an `int` on the wire, so a genuine decimal would be
 * rejected by System.Text.Json and 400 the entire batch with no indication of which row.
 */
export function parsePrice(raw: string): NumResult {
  const t = raw.trim();
  if (!t) return { kind: 'blank' };

  const cleaned = asciiDigits(t)
    .replace(/^(rs\.?|npr|₨|रू\.?)\s*/i, '')
    .replace(/\s*\/-$/, '')
    .replace(/[,\s ]/g, '');

  if (!/^\d+(\.0+)?$/.test(cleaned)) {
    if (/^\d+\.\d+$/.test(cleaned)) return { kind: 'bad', reason: 'Whole rupees only' };
    return { kind: 'bad', reason: 'Not a number' };
  }
  return { kind: 'ok', value: Math.trunc(Number(cleaned)) };
}

export function parseCount(raw: string): NumResult {
  const t = raw.trim();
  if (!t) return { kind: 'blank' };
  const cleaned = asciiDigits(t).replace(/[,\s ]/g, '');
  if (!/^\d+$/.test(cleaned)) return { kind: 'bad', reason: 'Whole number, 0 or more' };
  return { kind: 'ok', value: Number(cleaned) };
}

const TRUTHY = new Set(['true', 't', 'yes', 'y', '1', 'visible', 'live', 'available', 'on']);
const FALSY = new Set(['false', 'f', 'no', 'n', '0', 'hidden', 'unavailable', 'off']);

/** Blank means visible, matching the previous behaviour. Unrecognised returns null. */
export function parseBool(raw: string): boolean | null {
  const t = raw.trim().toLowerCase();
  if (!t) return true;
  if (TRUTHY.has(t)) return true;
  if (FALSY.has(t)) return false;
  return null;
}

/** Matches slugify()'s output shape so the form and the importer can't disagree on an id. */
export function effectiveId(row: DraftRow): string {
  const raw = row.cells.id.trim().toLowerCase().replace(/\s+/g, '-');
  return raw || slugify(row.cells.name);
}

// ── Draft rows ────────────────────────────────────────────────────────────────

export type DraftRow = {
  /** Stable across edits, filtering and re-renders. Never an array index. */
  key: string;
  /** Line in the original file, so a message can point at it. */
  line: number;
  include: boolean;
  /** Always strings — coerced only at validate and submit time, so a half-typed
   *  "2,4" isn't eaten mid-keystroke. */
  cells: Record<ImportField, string>;
};

function normaliseHeader(h: string): ImportField | null {
  const k = h.trim().toLowerCase().replace(/[\s_()]/g, '');
  const match = COLUMNS.find((c) => c.key.toLowerCase() === k);
  if (match) return match.key;
  // A few spellings a real sheet uses, so "Price NPR" or "Qty" isn't a silent blank column.
  const aliases: Record<string, ImportField> = {
    price: 'priceNpr', pricenpr: 'priceNpr', rate: 'priceNpr',
    productname: 'name', title: 'name', product: 'name',
    stock: 'stockQty', qty: 'stockQty', quantity: 'stockQty', stockquantity: 'stockQty',
    sku: 'id', slug: 'id', code: 'id',
    visible: 'available', published: 'available', active: 'available',
    badge: 'tag', reorder: 'reorderPoint', reorderat: 'reorderPoint',
  };
  return aliases[k] ?? null;
}

export type ParsedFile = {
  rows: DraftRow[];
  /** Required columns the file simply doesn't have — worth saying before showing a grid. */
  missing: ImportField[];
  headers: string[];
};

export function buildDraftRows(text: string): ParsedFile {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], missing: ['name', 'priceNpr'], headers: [] };

  const headers = table[0];
  const map = new Map<ImportField, number>();
  headers.forEach((h, i) => {
    const field = normaliseHeader(h);
    if (field && !map.has(field)) map.set(field, i);
  });

  const missing = COLUMNS.filter((c) => c.required && !map.has(c.key)).map((c) => c.key);

  const rows: DraftRow[] = table.slice(1).map((cells, i) => {
    const get = (f: ImportField) => {
      const at = map.get(f);
      return at === undefined ? '' : (cells[at] ?? '').trim();
    };
    const blank = {} as Record<ImportField, string>;
    for (const c of COLUMNS) blank[c.key] = get(c.key);
    // Normalise the boolean once so the grid's select always has a legal value to show.
    const parsed = parseBool(blank.available);
    blank.available = parsed === null ? blank.available : String(parsed);

    return { key: `r${i}`, line: i + 2, include: true, cells: blank };
  });

  return { rows, missing, headers };
}

// ── Validation ────────────────────────────────────────────────────────────────

export type Issue = { severity: 'error' | 'warning'; message: string };
export type RowIssues = Partial<Record<ImportField, Issue>>;

export function hasError(issues: RowIssues | undefined): boolean {
  return !!issues && Object.values(issues).some((i) => i?.severity === 'error');
}

/**
 * Per-field messages rather than a row-fatal string, because the point of the review step
 * is fixing the cell that's wrong — the previous version pushed `Row 7: invalid priceNpr`
 * and discarded the row entirely.
 */
export function validateRows(rows: DraftRow[], categoryKeys: Set<string>): Map<string, RowIssues> {
  const out = new Map<string, RowIssues>();

  // Two included rows sharing an id means the second silently overwrites the first, and
  // two NEW rows sharing one makes EF throw and 500s the whole batch.
  const idCounts = new Map<string, number>();
  for (const r of rows) {
    if (!r.include) continue;
    const id = effectiveId(r);
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }

  for (const r of rows) {
    const issues: RowIssues = {};
    const id = effectiveId(r);

    if (!r.cells.name.trim()) {
      issues.name = { severity: 'error', message: 'Name is required' };
    }

    const price = parsePrice(r.cells.priceNpr);
    if (price.kind === 'blank') issues.priceNpr = { severity: 'error', message: 'Price is required' };
    else if (price.kind === 'bad') issues.priceNpr = { severity: 'error', message: price.reason };

    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      issues.id = { severity: 'error', message: 'Letters, numbers and hyphens only' };
    } else if (r.include && (idCounts.get(id) ?? 0) > 1) {
      issues.id = { severity: 'error', message: 'Another row has this id — one would overwrite the other' };
    }

    const stock = parseCount(r.cells.stockQty);
    if (stock.kind === 'bad') issues.stockQty = { severity: 'error', message: stock.reason };

    const reorder = parseCount(r.cells.reorderPoint);
    if (reorder.kind === 'bad') issues.reorderPoint = { severity: 'error', message: reorder.reason };

    if (parseBool(r.cells.available) === null) {
      issues.available = { severity: 'error', message: 'Use Visible or Hidden' };
    }

    // A warning, not an error: it imports fine, just uncategorised. Previously this was
    // silent, and the preview showed the typo'd key as though it had matched.
    const cat = r.cells.category.trim().toLowerCase();
    if (cat && !categoryKeys.has(cat)) {
      issues.category = { severity: 'warning', message: 'Not one of your categories — will import uncategorised' };
    }

    out.set(r.key, issues);
  }

  return out;
}

// ── Submission ────────────────────────────────────────────────────────────────

export type ImportRow = {
  id: string;
  name: string;
  description: string;
  priceNpr: number;
  category: string;
  details?: string;
  tag?: string;
  available: boolean;
  stockQty: number | null;
  reorderPoint: number;
};

export function toImportRow(r: DraftRow): ImportRow {
  const price = parsePrice(r.cells.priceNpr);
  const stock = parseCount(r.cells.stockQty);
  const reorder = parseCount(r.cells.reorderPoint);
  const name = r.cells.name.trim();

  return {
    id: effectiveId(r),
    name,
    description: r.cells.description.trim() || name,
    priceNpr: price.kind === 'ok' ? price.value : 0,
    category: r.cells.category.trim(),
    details: r.cells.details.trim() || undefined,
    tag: r.cells.tag.trim() || undefined,
    available: parseBool(r.cells.available) ?? true,
    stockQty: stock.kind === 'ok' ? stock.value : null,
    reorderPoint: reorder.kind === 'ok' ? reorder.value : 0,
  };
}
