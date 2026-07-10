'use client';

import { useRef, useState, useTransition } from 'react';
import { importProductsCsv, type CsvRow, type ImportResult } from './actions';

// ── CSV template ──────────────────────────────────────────────────────────────

const TEMPLATE_HEADERS = ['id', 'name', 'description', 'priceNpr', 'category', 'details', 'tag', 'available', 'stockQty', 'reorderPoint'];
const TEMPLATE_EXAMPLE = ['macrame-shelf-single', 'Single-Tier Hanging Shelf', 'Handwoven cotton cord shelf with natural pine', '2400', 'shelf', '30×15 cm · natural pine · cotton cord', 'new', 'true', '10', '3'];

// Shown to the user inside the modal so column meaning isn't a guessing game.
const COLUMN_GUIDE: { key: string; required: boolean; hint: string }[] = [
  { key: 'id', required: false, hint: 'Slug/SKU. Leave blank to auto-generate from name.' },
  { key: 'name', required: true, hint: 'Product title.' },
  { key: 'description', required: false, hint: 'Falls back to name if blank.' },
  { key: 'priceNpr', required: true, hint: 'Price in NPR, numbers only.' },
  { key: 'category', required: false, hint: 'Must match an existing category key exactly (see Categories settings) — otherwise left uncategorized.' },
  { key: 'details', required: false, hint: 'Size / material line shown on product page.' },
  { key: 'tag', required: false, hint: 'Badge like "new" or "bestseller".' },
  { key: 'available', required: false, hint: '"false" hides it from the shop; anything else = visible.' },
  { key: 'stockQty', required: false, hint: 'Units in stock. Leave blank for unlimited stock.' },
  { key: 'reorderPoint', required: false, hint: 'Low-stock alert threshold — flags the product once stockQty drops to this number or below. 0 = no alert.' },
];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]
    .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'products-import-template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  const parse = (line: string): string[] => {
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ',') { cells.push(cur); cur = ''; }
        else cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };
  const [headerLine, ...dataLines] = lines;
  return { headers: parse(headerLine), rows: dataLines.map(parse) };
}

function rowsToCsvRows(headers: string[], rows: string[][]): { valid: CsvRow[]; errors: string[] } {
  const idx = (key: string) => headers.findIndex((h) => h.trim().toLowerCase() === key);
  const col = (row: string[], key: string) => row[idx(key)]?.trim() ?? '';

  const valid: CsvRow[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    const lineNum = i + 2;
    const name = col(row, 'name');
    const priceRaw = col(row, 'pricenpr');
    const idRaw = col(row, 'id') || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (!name) { errors.push(`Row ${lineNum}: missing name`); return; }
    if (!priceRaw || isNaN(Number(priceRaw))) { errors.push(`Row ${lineNum}: invalid priceNpr "${priceRaw}"`); return; }

    const stockRaw = col(row, 'stockqty');
    valid.push({
      id: idRaw,
      name,
      description: col(row, 'description') || name,
      priceNpr: Number(priceRaw),
      category: col(row, 'category'),
      details: col(row, 'details') || undefined,
      tag: col(row, 'tag') || undefined,
      available: col(row, 'available').toLowerCase() !== 'false',
      stockQty: stockRaw === '' ? null : Number(stockRaw),
      reorderPoint: Number(col(row, 'reorderpoint') || '0'),
    });
  });

  return { valid, errors };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CsvImportButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<{ valid: CsvRow[]; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, startImport] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setParsed(rowsToCsvRows(headers, rows));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!parsed?.valid.length) return;
    startImport(async () => {
      const res = await importProductsCsv(parsed.valid);
      setResult(res);
      setParsed(null);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  function reset() {
    setOpen(false);
    setParsed(null);
    setResult(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900">Import products from CSV</h2>
              <button onClick={reset} className="text-stone-400 hover:text-stone-700 transition-colors">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Result state */}
              {result && (
                <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                  <p className="text-sm font-medium text-stone-900">Import complete</p>
                  <p className="text-sm text-green-700">✓ {result.created} product{result.created !== 1 ? 's' : ''} imported</p>
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-600">{result.errors.length} error{result.errors.length !== 1 ? 's' : ''}:</p>
                      <ul className="mt-1 space-y-1">
                        {result.errors.map((e, i) => (
                          <li key={i} className="text-xs text-red-500">Row {e.row} ({e.id}): {e.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button onClick={reset} className="mt-2 text-sm text-stone-500 underline">Close</button>
                </div>
              )}

              {!result && (
                <>
                  {/* Template download */}
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
                    <p className="text-sm text-stone-600">Need the format? Download a template first.</p>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-sm font-medium text-stone-800 underline underline-offset-2"
                    >
                      Download
                    </button>
                  </div>

                  {/* Column glossary */}
                  <details className="group rounded-xl border border-stone-100 open:bg-stone-50/60">
                    <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 list-none flex items-center justify-between">
                      What do the columns mean?
                      <span className="text-stone-400 transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <ul className="px-4 pb-3 space-y-1.5">
                      {COLUMN_GUIDE.map((c) => (
                        <li key={c.key} className="text-xs text-stone-600 leading-relaxed">
                          <span className="font-mono font-medium text-stone-800">{c.key}</span>
                          {c.required && <span className="text-red-500"> *</span>}
                          {' — '}{c.hint}
                        </li>
                      ))}
                    </ul>
                  </details>

                  {/* File picker */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Select CSV file</label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFile}
                      className="block w-full text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-stone-200 file:text-sm file:bg-white file:text-stone-700 hover:file:bg-stone-50 cursor-pointer"
                    />
                  </div>

                  {/* Parse errors */}
                  {parsed?.errors.length ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                      <p className="text-sm font-medium text-red-700 mb-1">Some rows have errors and will be skipped:</p>
                      <ul className="space-y-0.5">
                        {parsed.errors.map((e, i) => <li key={i} className="text-xs text-red-600">{e}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  {/* Preview */}
                  {parsed && parsed.valid.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-stone-700 mb-2">
                        {fileName} — <span className="text-green-700">{parsed.valid.length} product{parsed.valid.length !== 1 ? 's' : ''} ready to import</span>
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-stone-100">
                        <table className="w-full text-xs">
                          <thead className="bg-stone-50">
                            <tr>
                              {['ID', 'Name', 'Price', 'Category', 'Stock', 'Reorder at'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left font-medium text-stone-500">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {parsed.valid.slice(0, 5).map((r, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-stone-500 font-mono">{r.id}</td>
                                <td className="px-3 py-2 text-stone-800">{r.name}</td>
                                <td className="px-3 py-2 text-stone-700">NPR {r.priceNpr.toLocaleString()}</td>
                                <td className="px-3 py-2 text-stone-600">{r.category}</td>
                                <td className="px-3 py-2 text-stone-600">{r.stockQty ?? '–'}</td>
                                <td className="px-3 py-2 text-stone-600">{r.reorderPoint > 0 ? r.reorderPoint : '–'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsed.valid.length > 5 && (
                          <p className="px-3 py-2 text-xs text-stone-400 bg-stone-50">…and {parsed.valid.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!result && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100">
                <button onClick={reset} className="text-sm text-stone-500 hover:text-stone-800 transition-colors">Cancel</button>
                <button
                  onClick={handleImport}
                  disabled={!parsed?.valid.length || importing}
                  className="bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? 'Importing…' : `Import ${parsed?.valid.length ?? 0} product${parsed?.valid.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
