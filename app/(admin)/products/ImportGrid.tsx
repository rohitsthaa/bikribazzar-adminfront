'use client';

import { memo, useState } from 'react';
import {
  PRIMARY_COLUMNS, SECONDARY_COLUMNS, diffRow, effectiveId, hasError,
  type DraftRow, type ExistingProduct, type FieldChange, type ImportField, type RowIssues,
} from '@/lib/product-import';

type Category = { key: string; label: string };

/**
 * The review step: every parsed row, editable, before anything is written.
 *
 * Replaces a read-only preview of the first five VALID rows. Rows that failed validation
 * used to be dropped entirely and reported as a line of text, which left the merchant
 * guessing what we wanted and re-exporting from their spreadsheet.
 */
export default function ImportGrid({
  rows, issues, categories, currency, existing, onCell, onInclude,
}: {
  rows: DraftRow[];
  issues: Map<string, RowIssues>;
  categories: Category[];
  currency: string;
  /** null while still loading — the grid shows no badges rather than guessing. */
  existing: Map<string, ExistingProduct> | null;
  onCell: (key: string, field: ImportField, value: string) => void;
  onInclude: (key: string, include: boolean) => void;
}) {
  const [problemsOnly, setProblemsOnly] = useState(false);

  const broken = rows.filter((r) => r.include && hasError(issues.get(r.key)));
  const shown = problemsOnly ? rows.filter((r) => hasError(issues.get(r.key))) : rows;

  return (
    <div>
      {broken.length > 0 && (
        <label className="mb-2 flex items-center gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={problemsOnly}
            onChange={(e) => setProblemsOnly(e.target.checked)}
          />
          Show only rows that need fixing ({broken.length})
        </label>
      )}

      <div className="overflow-auto rounded-xl border border-stone-200" style={{ maxHeight: '55vh' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-stone-50 text-stone-500">
            <tr>
              <th scope="col" className="w-8 px-2 py-2 font-medium" title="Include this row">✓</th>
              <th scope="col" className="w-10 px-2 py-2 text-left font-medium">Row</th>
              <th scope="col" className="w-16 px-2 py-2 text-left font-medium" title="Whether this row creates a product or overwrites an existing one">
                Action
              </th>
              {PRIMARY_COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="px-2 py-2 text-left font-medium" title={c.hint}>
                  {c.label}
                  {c.key === 'priceNpr' && <span className="ml-1 text-stone-400">({currency})</span>}
                  {c.required && <span className="ml-0.5 text-red-400">*</span>}
                </th>
              ))}
              <th scope="col" className="w-8 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {shown.map((row) => (
              <Row
                key={row.key}
                row={row}
                issues={issues.get(row.key) ?? {}}
                categories={categories}
                existing={existing === null ? null : existing.get(effectiveId(row)) ?? false}
                onCell={onCell}
                onInclude={onInclude}
              />
            ))}
          </tbody>
        </table>
      </div>

      {shown.length === 0 && (
        <p className="py-6 text-center text-xs text-stone-400">Nothing to show.</p>
      )}
    </div>
  );
}

// Memoised, and the parent updates rows with a keyed functional update that preserves the
// identity of untouched rows — so typing in one cell re-renders one row, not all of them.
const Row = memo(function Row({
  row, issues, categories, existing, onCell, onInclude,
}: {
  row: DraftRow;
  issues: RowIssues;
  categories: Category[];
  /** The product this row would overwrite, false if it is new, null if not looked up yet. */
  existing: ExistingProduct | false | null;
  onCell: (key: string, field: ImportField, value: string) => void;
  onInclude: (key: string, include: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rowHasError = hasError(issues);
  // Recomputed per render from the row's current cells, so editing a price updates the
  // change list as you type.
  const changes: FieldChange[] = existing ? diffRow(row, existing) : [];

  // Excluded rows stay editable — the point is to fix one and put it back in.
  const dim = row.include ? '' : 'opacity-45';

  return (
    <>
      <tr className={`${dim} ${rowHasError && row.include ? 'bg-red-50/40' : ''}`}>
        <td className="px-2 py-1.5 align-top">
          <input
            type="checkbox"
            checked={row.include}
            onChange={(e) => onInclude(row.key, e.target.checked)}
            aria-label={`Include row ${row.line}`}
          />
        </td>
        <td className="px-2 py-1.5 align-top text-stone-400">{row.line}</td>
        <td className="px-2 py-1.5 align-top">
          {existing === null ? (
            <span className="text-stone-300">—</span>
          ) : existing === false ? (
            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-100">
              New
            </span>
          ) : changes.length === 0 ? (
            // Worth saying plainly: re-importing an unchanged sheet is a no-op, and a row
            // that looks like it will overwrite something but changes nothing is reassuring.
            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500" title="Nothing in this row differs from the saved product">
              No change
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100"
              title={changes.map((c) => `${c.label}: ${c.from || '(blank)'} → ${c.to || '(blank)'}`).join('\n')}
            >
              {changes.length} {changes.length === 1 ? 'change' : 'changes'}
            </button>
          )}
        </td>

        {PRIMARY_COLUMNS.map((c) => (
          <td key={c.key} className="px-1.5 py-1.5 align-top">
            <Cell
              row={row}
              field={c.key}
              label={c.label}
              issue={issues[c.key]}
              categories={categories}
              onCell={onCell}
            />
          </td>
        ))}

        <td className="px-2 py-1.5 align-top">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-stone-400 hover:text-stone-700"
            aria-expanded={expanded}
            aria-label={`More fields for row ${row.line}`}
          >
            {expanded ? '▴' : '▾'}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className={dim}>
          <td />
          <td />
          <td />
          <td colSpan={PRIMARY_COLUMNS.length + 1} className="px-1.5 pb-3">
            {changes.length > 0 && (
              <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                  This row will change
                </p>
                <ul className="space-y-0.5">
                  {changes.map((c) => (
                    <li key={c.field} className="text-[11px] text-stone-600">
                      <span className="text-stone-500">{c.label}:</span>{' '}
                      <span className="line-through decoration-stone-300">{c.from || '(blank)'}</span>
                      {' → '}
                      <span className="font-medium text-stone-800">{c.to || '(blank)'}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[10px] text-stone-500">
                  Photos, SEO and other fields not in this file are left as they are.
                </p>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {SECONDARY_COLUMNS.map((c) => (
                <label key={c.key} className="block">
                  <span className="mb-0.5 block text-[11px] text-stone-400">{c.label}</span>
                  <Cell
                    row={row}
                    field={c.key}
                    label={c.label}
                    issue={issues[c.key]}
                    categories={categories}
                    onCell={onCell}
                  />
                </label>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

function Cell({
  row, field, label, issue, categories, onCell,
}: {
  row: DraftRow;
  field: ImportField;
  label: string;
  issue?: { severity: 'error' | 'warning'; message: string };
  categories: Category[];
  onCell: (key: string, field: ImportField, value: string) => void;
}) {
  const describedBy = issue ? `${row.key}-${field}-msg` : undefined;
  const tone =
    issue?.severity === 'error' ? 'border-red-300 bg-red-50'
    : issue?.severity === 'warning' ? 'border-amber-300 bg-amber-50'
    : 'border-stone-200';
  const base = `w-full rounded-md border px-1.5 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-300 ${tone}`;
  const value = row.cells[field];

  let control: React.ReactNode;

  if (field === 'category') {
    const known = categories.some((c) => c.key.toLowerCase() === value.trim().toLowerCase());
    control = (
      <select
        value={known ? value.trim().toLowerCase() : value.trim() === '' ? '' : '__unknown'}
        onChange={(e) => onCell(row.key, field, e.target.value === '__unknown' ? value : e.target.value)}
        className={base}
        aria-label={`${label}, row ${row.line}`}
        aria-invalid={issue?.severity === 'error' || undefined}
        aria-describedby={describedBy}
      >
        <option value="">— Uncategorised —</option>
        {categories.map((c) => (
          <option key={c.key} value={c.key.toLowerCase()}>{c.label}</option>
        ))}
        {/* The file's own value, kept visible so it's obvious what was in the sheet
            rather than silently snapping to blank. */}
        {!known && value.trim() !== '' && (
          <option value="__unknown">{value.trim()} — not a category</option>
        )}
      </select>
    );
  } else if (field === 'available') {
    control = (
      <select
        value={value === 'false' ? 'false' : 'true'}
        onChange={(e) => onCell(row.key, field, e.target.value)}
        className={base}
        aria-label={`${label}, row ${row.line}`}
      >
        <option value="true">Visible</option>
        <option value="false">Hidden</option>
      </select>
    );
  } else if (field === 'description' || field === 'details') {
    control = (
      <textarea
        value={value}
        rows={2}
        onChange={(e) => onCell(row.key, field, e.target.value)}
        className={base}
        aria-label={`${label}, row ${row.line}`}
      />
    );
  } else {
    control = (
      <input
        type="text"
        value={value}
        onChange={(e) => onCell(row.key, field, e.target.value)}
        className={`${base} ${field === 'priceNpr' || field === 'stockQty' ? 'tabular-nums' : ''}`}
        aria-label={`${label}, row ${row.line}`}
        aria-invalid={issue?.severity === 'error' || undefined}
        aria-describedby={describedBy}
      />
    );
  }

  return (
    <>
      {control}
      {issue && (
        <p
          id={describedBy}
          className={`mt-0.5 text-[10px] ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-700'}`}
        >
          {issue.message}
        </p>
      )}
    </>
  );
}
