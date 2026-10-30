'use client';

import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { exportProductsCsv, getExistingProductSummaries, importProductsCsv, type ImportResult } from './actions';
import ImportGrid from './ImportGrid';
import {
  COLUMNS, MAX_ROWS, buildDraftRows, diffRow, effectiveId, hasError, templateCsv,
  categoryLookupKey, toImportRow, validateRows,
  type DraftRow, type ExistingProduct, type ImportField,
} from '@/lib/product-import';

type Category = { key: string; label: string };
type Step = 'pick' | 'review' | 'done';

function downloadTemplate() {
  const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'products-import-template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Spreadsheet import: pick a file, review and fix every row, then import.
 *
 * The review step is the point. Previously the modal showed the first five VALID rows
 * read-only and discarded anything that failed validation, so a merchant with one bad
 * price had to go back to their spreadsheet, guess what format we wanted, and re-export.
 */
export default function CsvImportButton({
  categories, currency = 'NPR',
}: {
  categories: Category[];
  currency?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [fileError, setFileError] = useState('');
  const [touched, setTouched] = useState(false);
  // null until the lookup returns, so the grid shows "—" rather than claiming every row
  // is new while it waits.
  const [existing, setExisting] = useState<Map<string, ExistingProduct> | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, startImport] = useTransition();
  const [exportError, setExportError] = useState('');
  const [exporting, startExport] = useTransition();

  function handleExport() {
    setExportError('');
    startExport(async () => {
      const result = await exportProductsCsv();
      if (!result.ok) { setExportError(result.error); return; }
      const url = URL.createObjectURL(new Blob([result.csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a'); a.href = url; a.download = 'products-export.csv'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  const categoryKeys = useMemo(
    () => new Set(categories.flatMap((c) => [categoryLookupKey(c.key), categoryLookupKey(c.label)])),
    [categories],
  );

  // Derived, never stored. Keeping a second copy in state and syncing it on every
  // keystroke is where "my edit reverted" bugs come from.
  const issues = useMemo(() => validateRows(rows, categoryKeys), [rows, categoryKeys]);

  const included = rows.filter((r) => r.include);
  const brokenIncluded = included.filter((r) => hasError(issues.get(r.key)));
  const canImport = included.length > 0 && brokenIncluded.length === 0;

  // Counted over the rows that will actually be sent, and recounted as ids are edited —
  // renaming an id in the grid flips a row between New and Update.
  const matched = existing === null
    ? []
    : included.map((r) => ({ row: r, found: existing.get(effectiveId(r)) })).filter((m) => m.found);
  // Split the updates: a row that matches an existing product but changes none of the
  // columns in the file is a no-op, and saying so is more honest than counting it.
  const changing = matched.filter((m) => diffRow(m.row, m.found!).length > 0).length;
  const unchanged = matched.length - changing;
  const adding = existing === null ? 0 : included.length - matched.length;

  // Keyed functional update: untouched rows keep their object identity, so the memoised
  // row component genuinely skips them.
  const onCell = useCallback((key: string, field: ImportField, value: string) => {
    setTouched(true);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, cells: { ...r.cells, [field]: value } } : r)));
  }, []);

  const onInclude = useCallback((key: string, include: boolean) => {
    setTouched(true);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, include } : r)));
  }, []);

  function excludeBroken() {
    setTouched(true);
    setRows((rs) => rs.map((r) => (hasError(issues.get(r.key)) ? { ...r, include: false } : r)));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: parsed, missing, headers } = buildDraftRows((ev.target?.result as string) ?? '');

      if (missing.length > 0) {
        setFileError(
          `This file has no ${missing.join(' or ')} column. Columns found: ${headers.join(', ') || 'none'}.`,
        );
        return;
      }
      if (parsed.length === 0) {
        setFileError('This file has no rows under the header.');
        return;
      }
      if (parsed.length > MAX_ROWS) {
        setFileError(
          `This file has ${parsed.length} rows. Import up to ${MAX_ROWS} at a time — split it and run it twice.`,
        );
        return;
      }

      setRows(parsed);
      setTouched(false);
      setStep('review');

      // Which rows overwrite something is the most useful thing to know before importing,
      // now that a re-import updates in place. Fetched here rather than on every Products
      // page load, since the page is paginated and only holds 50 products anyway.
      setExisting(null);
      getExistingProductSummaries()
        .then((list) => setExisting(new Map(list.map((p) => [p.id, p]))))
        .catch(() => setExisting(new Map()));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    startImport(async () => {
      const res = await importProductsCsv(included.map(toImportRow));
      setResult(res);
      if (res.ok) {
        setRows([]);
        setFileName('');
        setStep('done');
        if (fileRef.current) fileRef.current.value = '';
      }
    });
  }

  function close() {
    // Losing twenty minutes of grid edits to a stray click would end trust in this.
    if (step === 'review' && touched && !confirm('Discard your changes to this import?')) return;
    setOpen(false);
    setStep('pick');
    setRows([]);
    setResult(null);
    setFileName('');
    setFileError('');
    setTouched(false);
    setExisting(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <>
      <button type="button" onClick={handleExport} disabled={exporting} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50">
        {exporting ? 'Exporting…' : 'Export products'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Import
      </button>
      {exportError && <span role="alert" className="text-xs text-red-600">{exportError}</span>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:p-8" onClick={close}>
          <div
            className={`w-full rounded-2xl bg-white p-6 shadow-xl ${step === 'review' ? 'max-w-5xl' : 'max-w-lg'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Import products</h2>
                <p className="mt-0.5 text-xs text-stone-400">
                  {step === 'review'
                    ? `${fileName} — check and fix anything flagged, then import.`
                    : step === 'done'
                    ? 'Import finished.'
                    : 'Upload a CSV. You can review and edit every row before anything is saved.'}
                </p>
              </div>
              <button type="button" onClick={close} className="text-stone-400 hover:text-stone-700" aria-label="Close">✕</button>
            </div>

            {/* ── Step: pick a file ── */}
            {step === 'pick' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-stone-600">Not sure of the format?</p>
                    <button type="button" onClick={downloadTemplate} className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50">
                      Download template
                    </button>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-stone-500">What each column means</summary>
                    <ul className="mt-2 space-y-1">
                      {COLUMNS.map((c) => (
                        <li key={c.key} className="text-[11px] text-stone-500">
                          <span className="font-mono text-stone-700">{c.key}</span>
                          {c.required && <span className="text-red-400"> *</span>} — {c.hint}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFile}
                  className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border file:border-stone-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-stone-700 hover:file:bg-stone-50"
                />

                {fileError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{fileError}</p>
                )}
              </div>
            )}

            {/* ── Step: review and edit ── */}
            {step === 'review' && (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p className="text-stone-600">
                    <span className="font-semibold text-stone-900">{included.length}</span> of {rows.length} rows will import
                    {existing !== null && included.length > 0 && (
                      <span className="text-stone-500">
                        {' '}· {adding} new · {changing} {changing === 1 ? 'update' : 'updates'}
                        {unchanged > 0 && ` · ${unchanged} unchanged`}
                      </span>
                    )}
                    {brokenIncluded.length > 0 && (
                      <span className="text-red-600"> · {brokenIncluded.length} need fixing</span>
                    )}
                  </p>
                  {brokenIncluded.length > 0 && (
                    <button type="button" onClick={excludeBroken} className="rounded-lg border border-stone-200 px-2.5 py-1 font-medium text-stone-600 hover:bg-stone-50">
                      Skip the {brokenIncluded.length} broken {brokenIncluded.length === 1 ? 'row' : 'rows'}
                    </button>
                  )}
                </div>

                <ImportGrid
                  rows={rows}
                  issues={issues}
                  categories={categories}
                  currency={currency}
                  existing={existing}
                  onCell={onCell}
                  onInclude={onInclude}
                />

                {result && !result.ok && (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{result.error}</p>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button type="button" onClick={close} className="rounded-xl px-3 py-2 text-sm text-stone-500 hover:text-stone-800">Cancel</button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!canImport || importing}
                    className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importing ? 'Importing…' : `Import ${included.length} ${included.length === 1 ? 'product' : 'products'}`}
                  </button>
                </div>
              </>
            )}

            {/* ── Step: done ── */}
            {step === 'done' && result?.ok && (
              <div className="space-y-3">
                <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  {/* Both numbers, because a re-import of existing products used to report
                      "0 products imported" and read as a failure. */}
                  {result.created} added · {result.updated} updated
                  {result.categoriesCreated > 0 && ` · ${result.categoriesCreated} ${result.categoriesCreated === 1 ? 'category' : 'categories'} created`}
                </p>
                <div className="flex justify-end">
                  <button type="button" onClick={close} className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
