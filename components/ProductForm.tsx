'use client';
import { useRef, useState, useActionState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import type { Product, Category } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { VISIBILITY_OPTIONS, visibilityOf, type Visibility } from '@/lib/visibility';
import { marginPercent } from '@/lib/stock';
import ImageUploader from './ImageUploader';
import ImageCropModal from './ImageCropModal';
import SubmitButton from './SubmitButton';
import VariantStockControls from './VariantStockControls';

type PrepaymentType = 'none' | 'percentage' | 'fixed';

type Props = {
  product?: Product;
  action: (state: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
  categories?: Category[];
  canSetPrice?: boolean; // staff can't set/change price
  // Rendered in the left rail, below Visibility — the edit page passes its
  // <InventoryPanel> here (stock pill, Restock/Adjust, movement log) so it's
  // visible alongside every tab instead of a separate sidebar (non-variant
  // products) or buried in one specific tab (variant products).
  inventoryPanel?: ReactNode;
  // Active store template — threaded down to every image uploader (primary,
  // gallery, variant photos) so the crop tool's "how this will look on your
  // storefront" preview uses this store's real card aspect ratio.
  cardAspect?: string;
};

// Shared class for numeric inputs — hides the native up/down spinner so a
// short field (e.g. a 3-column dimension row) never clips its own text, and
// so every number field in the form looks the same rather than some having
// spinner arrows and others not.
const numInput =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
const textInput =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/50';
const fieldLabel = 'block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

// "Cotton Kurta — Indigo" → "COTTON-KURTA-INDIGO". Suggested, never forced: plenty of shops
// already have their own codes. Kept short enough to print on a label.
function suggestSku(...parts: string[]): string {
  return parts
    .map((p) => p.toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('-')
    .slice(0, 32)
    .replace(/-+$/, '');
}

// 16px line icons, same visual language as components/Sidebar.tsx's `Icons`.
function TabIcon({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const TAB_ICONS = {
  details:  'M4 4h16v16H4zM4 9h16M9 4v16',
  pricing:  'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  variants: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
};

type TabKey = 'details' | 'pricing' | 'variants' | 'settings';

// Reusable collapsible section header — for the optional/secondary blocks
// (Physical details, Advance payment, SEO) so they don't clutter product
// types that don't need them (e.g. dimensions don't apply to apparel).
function SectionToggle({
  title, subtitle, open, onToggle,
}: { title: string; subtitle: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between text-left">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  );
}

// A card section header with a small colored icon chip — the "designed"
// touch the rest of the admin already uses (Sidebar, InventoryPanel) that
// this form was missing.
function SectionHeading({ icon, title, subtitle, className = 'mb-4' }: { icon: string; title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[#c96a3a]/10 text-[#c96a3a] flex items-center justify-center">
        <TabIcon d={icon} />
      </span>
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// 56×56 thumbnail uploader for a single variant row — e.g. a photo of that
// color. Full-size ImageUploader (with its drop zone + URL field) is too tall
// to fit inline in the variant table, so this reuses the same /api/upload
// endpoint with a much smaller control. Rendered as a circle (rounded-full),
// matching the actual round color/style swatch this becomes on the storefront
// (components/ProductActions.tsx, 44px circle) — a square admin thumbnail for
// a circular storefront swatch would misrepresent framing the same way the
// crop tool was built to prevent for the primary image. Still small at this
// size, though, so a filled thumbnail opens a larger preview on click rather
// than jumping straight to the file picker — Replace/Crop/Remove live there.
// Tag-style list input for the colour × size builder: type a value and press Enter (or a
// comma) to add it as a chip; Backspace on an empty box removes the last one. Pasting
// "S, M, L" adds all three. A half-typed value is committed on blur, so clicking
// "Create combinations" straight after typing still includes it.
function ChipListInput({ values, onChange, placeholder, ariaLabel }: {
  values: string[]; onChange: (next: string[]) => void; placeholder: string; ariaLabel: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = (raw: string) => {
    const seen = new Set(values.map((v) => v.toLowerCase()));
    const added = raw.split(',').map((x) => x.trim()).filter((x) => x && !seen.has(x.toLowerCase()) && (seen.add(x.toLowerCase()), true));
    if (added.length) onChange([...values, ...added]);
    setDraft('');
  };
  return (
    <div className="flex min-h-[42px] w-full min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#c96a3a]/30">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-0.5 pl-2.5 pr-1 text-xs font-medium text-stone-700">
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`Remove ${v}`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(',')) commit(v); else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(draft); }
          else if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={values.length ? 'Add another…' : placeholder}
        className="min-w-[90px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none"
      />
    </div>
  );
}

function VariantImageCell({ value, onChange, cardAspect }: { value: string; onChange: (url: string) => void; cardAspect?: string }) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok) onChange(json.url);
    } finally {
      setUploading(false);
    }
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function handleCropSave(blob: Blob) {
    closeCrop();
    uploadFile(new File([blob], 'variant.jpg', { type: 'image/jpeg' }));
  }

  // Re-crop the existing photo (from the preview popover) — fetched through
  // the same same-origin /api/image proxy the thumbnail uses, so the canvas
  // export in ImageCropModal never gets cross-origin-tainted.
  async function startRecrop() {
    if (!value) return;
    const res = await fetch(`/api/image?src=${encodeURIComponent(value)}`);
    if (!res.ok) return;
    const blob = await res.blob();
    setCropSrc(URL.createObjectURL(blob));
  }

  return (
    <div className="relative w-14 h-14 shrink-0">
      <button
        type="button"
        onClick={() => (value ? setPreviewOpen(true) : inputRef.current?.click())}
        title={value ? 'View variant photo' : 'Add variant photo'}
        className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center hover:border-[#c96a3a]/50 transition-colors"
      >
        {uploading ? (
          <svg className="w-5 h-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/image?src=${encodeURIComponent(value)}`} alt="" draggable={false} className="w-full h-full object-cover" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Remove photo"
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-xs leading-none"
        >
          ×
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setCropSrc(URL.createObjectURL(file));
          e.target.value = '';
        }}
      />
      {previewOpen && value && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-56 h-56 rounded-full overflow-hidden border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/image?src=${encodeURIComponent(value)}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setPreviewOpen(false); startRecrop(); }}
                className="px-3 py-2 border border-stone-200 hover:border-stone-400 text-xs font-medium text-stone-700 rounded-lg transition-colors"
              >
                Crop
              </button>
              <button
                type="button"
                onClick={() => { setPreviewOpen(false); inputRef.current?.click(); }}
                className="px-3 py-2 border border-stone-200 hover:border-stone-400 text-xs font-medium text-stone-700 rounded-lg transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => { setPreviewOpen(false); onChange(''); }}
                className="px-3 py-2 border border-stone-200 hover:border-red-300 text-xs font-medium text-red-500 rounded-lg transition-colors"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          cardAspect={cardAspect}
          mode="variant"
          onCancel={closeCrop}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}

function Submit({ isNew, onClick }: { isNew: boolean; onClick?: (e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <SubmitButton
      label={isNew ? 'Create product' : 'Save changes'}
      onClick={onClick}
      className="relative overflow-hidden px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13.5px] rounded-lg transition-colors font-semibold"
    />
  );
}

export default function ProductForm({ product, action, categories = [], canSetPrice = true, inventoryPanel, cardAspect }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [image, setImage] = useState(product?.image ?? '');
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.images ?? []);
  const [seoOpen, setSeoOpen] = useState(!!(product?.metaTitle || product?.metaDescription));
  const [physicalOpen, setPhysicalOpen] = useState(
    !!(product?.widthCm || product?.heightCm || product?.depthCm || product?.details)
  );
  const [prepaymentType, setPrepaymentType] = useState<PrepaymentType>(
    (product?.prepaymentType as PrepaymentType) ?? 'none'
  );
  const [advanceOpen, setAdvanceOpen] = useState(prepaymentType !== 'none');
  const [isDigital, setIsDigital] = useState(product?.isDigital ?? false);
  const [variantAxis, setVariantAxis] = useState<string>(product?.variantAxis ?? '');
  const isColorSize = variantAxis === 'color_size';
  const hasVisualVariants = variantAxis === 'color' || variantAxis === 'style' || isColorSize;
  const [digitalAssetUrl, setDigitalAssetUrl] = useState(product?.digitalAssetUrl ?? '');
  type VariantRow = { id?: string; label: string; color: string; size: string; priceNpr: string; costNpr: string; stockQty: string; untracked: boolean; sku: string; image: string };
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      color: v.color ?? '',
      size: v.size ?? '',
      priceNpr: v.priceNpr == null ? '' : String(v.priceNpr),
      costNpr: v.costNpr == null ? '' : String(v.costNpr),
      stockQty: v.stockQty == null ? '' : String(v.stockQty),
      untracked: v.stockQty == null,
      sku: v.sku ?? '',
      image: v.image ?? '',
    })),
  );
  const blankVariant: VariantRow = { label: '', color: '', size: '', priceNpr: '', costNpr: '', stockQty: '', untracked: false, sku: '', image: '' };
  function addVariant() { setVariants([...variants, { ...blankVariant }]); }
  function removeVariant(idx: number) { setVariants(variants.filter((_, i) => i !== idx)); }
  function updateVariant(idx: number, patch: Partial<VariantRow>) {
    const target = variants[idx];
    setVariants(variants.map((v, i) => {
      if (i === idx) {
        const next = { ...v, ...patch };
        // Colour × size rows: the label is always "Colour / Size" (the API derives it too).
        if (isColorSize && ('color' in patch || 'size' in patch)) next.label = comboLabel(next.color, next.size);
        return next;
      }
      // A colour's photo is the same for every size — set it once, apply to all its sizes.
      if (isColorSize && 'image' in patch && target.color.trim() && v.color.trim().toLowerCase() === target.color.trim().toLowerCase()) {
        return { ...v, image: patch.image ?? '' };
      }
      return v;
    }));
  }

  // ── Colour × size builder ──
  // The merchant types the colours and sizes once; "Create combinations" makes one option
  // per pair. Existing rows (and their ids, stock, prices, SKUs) are kept by matching on
  // colour + size, so rebuilding after adding "XL" never resets the stock of "Red / M".
  const comboLabel = (color: string, size: string) => [color.trim(), size.trim()].filter(Boolean).join(' / ');
  const uniqueOf = (key: 'color' | 'size') => [...new Map(variants.map((v) => v[key].trim()).filter(Boolean).map((x) => [x.toLowerCase(), x])).values()];
  const [colorList, setColorList] = useState<string[]>(() => uniqueOf('color'));
  const [sizeList, setSizeList] = useState<string[]>(() => uniqueOf('size'));
  function changeAxis(next: string) {
    setVariantAxis(next);
    if (next !== 'color_size') return;
    // Switching an existing "Red / M"-style list over: split the labels into colour + size.
    const split = variants.map((v) => {
      if (v.color.trim() && v.size.trim()) return v;
      const [c, sz, ...rest] = v.label.split('/').map((x) => x.trim());
      return c && sz && rest.length === 0 ? { ...v, color: c, size: sz } : v;
    });
    setVariants(split);
    const uniq = (key: 'color' | 'size') => [...new Map(split.map((v) => v[key].trim()).filter(Boolean).map((x) => [x.toLowerCase(), x])).values()];
    if (colorList.length === 0) setColorList(uniq('color'));
    if (sizeList.length === 0) setSizeList(uniq('size'));
  }
  function buildCombinations() {
    const colors = colorList;
    const sizes = sizeList;
    if (colors.length === 0 || sizes.length === 0) return;
    const key = (c: string, sz: string) => `${c.trim().toLowerCase()}|${sz.trim().toLowerCase()}`;
    const existing = new Map(variants.filter((v) => v.color.trim() && v.size.trim()).map((v) => [key(v.color, v.size), v]));
    const photoOf = (c: string) => variants.find((v) => v.color.trim().toLowerCase() === c.toLowerCase() && v.image.trim())?.image ?? '';
    const next: VariantRow[] = [];
    for (const c of colors) {
      for (const sz of sizes) {
        const keep = existing.get(key(c, sz));
        next.push(keep
          ? { ...keep, color: c, size: sz, label: comboLabel(c, sz) }
          : { ...blankVariant, color: c, size: sz, label: comboLabel(c, sz), image: photoOf(c) });
      }
    }
    // Anything not in the new grid is dropped — warn if that throws away counted stock.
    const kept = new Set(next);
    const dropped = variants.filter((v) => !kept.has(v));
    const droppedWithStock = dropped.filter((v) => {
      const saved = v.id ? (product?.variants ?? []).find((pv) => pv.id === v.id) : undefined;
      return (saved?.stockQty ?? 0) > 0;
    });
    if (droppedWithStock.length > 0 && !window.confirm(
      `${droppedWithStock.map((v) => v.label || 'An option').join(', ')} still ${droppedWithStock.length === 1 ? 'has' : 'have'} stock and will be removed. Continue?`,
    )) return;
    setVariants(next);
    setIsDirty(true);
  }
  const isNew = !product;
  // Auto-fill the ID (URL slug) field from the Name field as the merchant types,
  // so most people never have to think about "the slug" at all. A plain ref
  // (not state) for both the input and the "has the user typed into ID
  // themselves" flag — this keeps Name/ID uncontrolled like every other field
  // on this form, and avoids re-rendering the whole form on every keystroke.
  // Once the merchant edits the ID field directly, stop overwriting it — they
  // want a custom slug and further Name edits shouldn't clobber that choice.
  const idInputRef = useRef<HTMLInputElement>(null);
  const idTouchedRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);

  // Visibility is ONE choice in the UI (Live/Hidden/Draft/Archived) stored as the API's
  // available + status pair — see lib/visibility.ts for why they used to disagree.
  const [visibility, setVisibility] = useState<Visibility>(product ? visibilityOf(product) : 'live');

  // Price on request is an explicit choice, not "whatever 0 means" — a product saved at 0
  // by mistake used to silently turn into "On request" on the shop.
  const [onRequest, setOnRequest] = useState(product ? product.priceNpr === 0 : false);
  const [price, setPrice] = useState(product && product.priceNpr > 0 ? String(product.priceNpr) : '');
  const [cost, setCost] = useState(product?.costNpr != null ? String(product.costNpr) : '');
  const margin = marginPercent(Number(price) || 0, Number(cost) || null);

  // Stock tracking is explicit too. Blank used to mean "unlimited", so one empty field
  // let the shop oversell. On edit the count itself is read-only (Inventory panel owns it);
  // only switching tracking on/off is sent, via `stockTracking`.
  const initiallyUntracked = product ? product.stockQty === null : false;
  const [untracked, setUntracked] = useState(initiallyUntracked);
  // Serialized for the form action: empty price/stock → null (inherit / unlimited).
  // For a variant that already exists on the server, its Stock field in this
  // form is read-only (see the Variants tab) — stock only actually changes via
  // Restock/Adjust, which reloads the page. So its stockQty here is re-read
  // from `product` (the value the read-only badge shows), not from `v.stockQty`
  // draft state, so an unrelated field edit + Save can never resubmit a stale
  // number and clobber a restock/adjustment made elsewhere in the meantime —
  // same reasoning as the top-level Stock qty field above.
  const variantsPayload = JSON.stringify(
    variants
      .filter((v) => v.label.trim() || (isColorSize && v.color.trim() && v.size.trim()))
      .map((v, i) => {
        const persisted = !isNew && v.id ? (product?.variants ?? []).find((pv) => pv.id === v.id) : undefined;
        const both = isColorSize && v.color.trim() && v.size.trim();
        return {
          id: v.id,
          label: both ? comboLabel(v.color, v.size) : v.label.trim(),
          // Only meaningful for colour × size; switching the axis away clears them server-side.
          color: both ? v.color.trim() : null,
          size: both ? v.size.trim() : null,
          priceNpr: v.priceNpr.trim() === '' ? null : Number(v.priceNpr),
          costNpr: v.costNpr.trim() === '' ? null : Number(v.costNpr),
          // New rows: "Not tracked" → null (unlimited); otherwise blank counts as 0, never unlimited.
          stockQty: persisted ? persisted.stockQty : (v.untracked ? null : Number(v.stockQty.trim() || 0)),
          sku: v.sku.trim() || null,
          image: v.image.trim() || null,
          sortOrder: i,
        };
      }),
  );
  // Extracted so the read-only/editable Stock qty branches below don't each
  // re-narrow `product` through the `isNew` alias — TS treats that as two
  // independent (and, in one arm, contradictory) narrowings of `product`.
  const currentStockQty = product?.stockQty;
  // Which variant row (by id) currently has its Restock/Adjust panel open —
  // only one at a time keeps the tab from turning back into a wall of forms.
  const [expandedStockId, setExpandedStockId] = useState<string | null>(null);

  // Tracked via a form-level onInput/onChange (bubbles from every field) rather than
  // controlling each input — this form leans on native defaultValue/uncontrolled inputs
  // throughout, so a single bubbling listener is far less invasive than converting every
  // field to a controlled one just to know whether *anything* changed.
  const [isDirty, setIsDirty] = useState(false);

  const [tab, setTab] = useState<TabKey>('details');
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'details',  label: 'Details',        icon: TAB_ICONS.details },
    { key: 'pricing',  label: 'Pricing & stock', icon: TAB_ICONS.pricing },
    { key: 'variants', label: `Variants${variants.length ? ` (${variants.length})` : ''}`, icon: TAB_ICONS.variants },
    { key: 'settings', label: 'Settings',        icon: TAB_ICONS.settings },
  ];
  // Panels use `hidden` (display:none) rather than unmounting on tab switch —
  // every field must stay in the DOM so its value is still included in the
  // single native form submission on Save, regardless of which tab is active.
  const panel = (key: TabKey) => (tab === key ? '' : 'hidden');

  // A required field can be hidden (display:none) on a tab other than the
  // active one. This used to be handled in the form's onSubmit — but the
  // browser runs its own constraint validation *before* the 'submit' event
  // is ever dispatched, and when it fails there (silently, because the
  // invalid control isn't focusable) it aborts before onSubmit fires at
  // all. So onSubmit could never actually see this case — Save just
  // appeared to do nothing, logging "An invalid form control with
  // name='...' is not focusable" to the console instead of showing any
  // visible error. Intercepting the Save button's click instead works: we
  // check validity ourselves first (checkValidity() is safe on hidden
  // fields, unlike the browser's own submit-time check), jump to the
  // invalid field's tab so it becomes focusable, then ask the browser to
  // show its validation UI for real.
  const handleSaveClick = (e: MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form;
    if (!form || form.checkValidity()) return; // valid — let the native submit proceed
    e.preventDefault();
    const invalid = form.querySelector<HTMLElement>(':invalid');
    const invalidTab = invalid?.closest<HTMLElement>('[data-tab]')?.dataset.tab as TabKey | undefined;
    if (invalidTab && invalidTab !== tab) setTab(invalidTab);
    // Give React a tick to re-render the now-visible panel before asking
    // for validation UI again — this time the field is focusable.
    setTimeout(() => form.reportValidity(), 0);
  };

  return (
    <form action={formAction} onChange={() => setIsDirty(true)}>
      <input type="hidden" name="_isNew" value={isNew ? '1' : '0'} />
      {/* Snapshot of the images this product had before this edit — actions.ts
          diffs these against the saved values to clean up now-orphaned
          uploaded files (e.g. after a "Replace photo" or "Remove"). Only
          meaningful on edit; harmless empty arrays on create. */}
      <input type="hidden" name="_prevImage" value={product?.image ?? ''} />
      <input type="hidden" name="_prevImages" value={JSON.stringify(product?.images ?? [])} />
      <input
        type="hidden"
        name="_prevVariantImages"
        value={JSON.stringify((product?.variants ?? []).map((v) => v.image).filter(Boolean))}
      />

      {/* Sticky top bar — breadcrumb + save actions, reachable from any tab
          without scrolling. Scoped to this component's own width (not a
          full-bleed hack) since ProductForm can be nested next to a sibling
          column, e.g. the InventoryPanel sidebar on the edit page — a
          full-bleed bar would otherwise visually collide with it. */}
      <div className="sticky top-0 z-10 -mx-1 px-1 py-3 bg-stone-50/95 backdrop-blur border-b border-stone-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/products" className="shrink-0 text-[13px] font-semibold text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5">
            ← Products
          </Link>
          <span aria-hidden="true" className="h-4 w-px bg-stone-300" />
          <h1 className="truncate text-sm font-semibold text-stone-800">{isNew ? 'Add product' : 'Edit product'}</h1>
        </div>
        <div className="flex items-center justify-end gap-2.5">
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium mr-0.5">Unsaved changes</span>
          )}
          <Link href="/products" className="border border-stone-200 text-stone-600 text-[13.5px] px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors">
            Cancel
          </Link>
          <Submit isNew={isNew} onClick={handleSaveClick} />
        </div>
      </div>

      <div className="pt-6 pb-16">

        {state?.error && (
          <p className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {state.error}
          </p>
        )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left rail on desktop: visibility, media, inventory — visible across every tab.
            Below lg it stacks AFTER the tabbed form (order-2), with the photo capped in
            width: the 4:5 drop zone used to fill the whole first screen there, pushing
            name/price/stock below the fold. Visibility stays first in the rail. */}
        <div className="order-2 lg:order-1 lg:w-[300px] shrink-0 space-y-4">
          <div className={`rounded-xl border p-4 space-y-2.5 ${
            visibility === 'live' ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-200'
          }`}>
            <h2 className="text-[14.5px] font-semibold text-stone-900">Visibility</h2>
            <select
              name="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.value === 'live' ? '● ' : ''}{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-stone-500 leading-snug">
              {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-[18px]">
            <h2 className="text-[14.5px] font-semibold text-stone-900">Cover image</h2>
            <p className="text-xs text-stone-400 mt-0.5 mb-3.5">Used on product cards and as the first shared product photo.</p>
            <div className="max-w-[240px] lg:max-w-none">
              <ImageUploader value={image} onChange={setImage} enableCrop cardAspect={cardAspect} />
            </div>
            <input type="hidden" name="image" value={image} />
          </div>

          {inventoryPanel && (
            <div id="inventory-panel" className="scroll-mt-6">
              {inventoryPanel}
            </div>
          )}
        </div>

        {/* Right: tabbed content (first on narrow screens) */}
        <div className="order-1 lg:order-2 flex-1 min-w-0">
          {/* Tab bar — underline style, matches this app's page-nav convention
              elsewhere more closely than a segmented control would for four
              top-level sections (the segmented look stays reserved for the
              inline Restock/Adjust toggles inside Variants). */}
          <div className="flex items-center gap-1 border-b border-stone-200 mb-[22px] overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 -mb-px border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-[#c96a3a] text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <span className={tab === t.key ? 'text-[#c96a3a]' : 'text-stone-400'}>
                  <TabIcon d={t.icon} />
                </span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* ── Details tab ─────────────────────────────────────────────── */}
            <div data-tab="details" className={panel('details')}>
              <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabel}>ID (URL slug) <span className="text-red-400">*</span></label>
                    <input
                      ref={idInputRef}
                      name="id"
                      defaultValue={product?.id}
                      required
                      readOnly={!isNew}
                      pattern={isNew ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
                      title={isNew ? 'Lowercase letters, numbers, and hyphens only' : undefined}
                      onChange={isNew ? () => { idTouchedRef.current = true; } : undefined}
                      placeholder="e.g. product-name"
                      className={`${textInput} read-only:bg-gray-50 read-only:text-gray-400 font-mono`}
                    />
                    {isNew && <p className="text-xs text-gray-400 mt-1">Auto-filled from the name below — edit here only if you want a different URL. Can&apos;t change later.</p>}
                  </div>
                  <div>
                    <label className={fieldLabel}>SKU</label>
                    <div className="flex gap-1.5">
                      <input
                        ref={skuInputRef}
                        name="sku"
                        defaultValue={product?.sku ?? ''}
                        placeholder="Optional"
                        className={`${textInput} font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!skuInputRef.current) return;
                          skuInputRef.current.value = suggestSku(nameInputRef.current?.value ?? '');
                          setIsDirty(true);
                        }}
                        title="Suggest a SKU from the product name"
                        className="shrink-0 px-2.5 rounded-lg border border-gray-300 text-xs font-medium text-stone-600 hover:bg-stone-50"
                      >
                        Generate
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Your stock code. Blank if each option has its own.</p>
                  </div>
                </div>

                <div>
                  <label className={fieldLabel}>Name <span className="text-red-400">*</span></label>
                  <input
                    ref={nameInputRef}
                    name="name"
                    defaultValue={product?.name}
                    required
                    placeholder="Product name"
                    onChange={isNew ? (e) => {
                      if (idTouchedRef.current || !idInputRef.current) return;
                      idInputRef.current.value = slugify(e.target.value);
                    } : undefined}
                    className={`${textInput} text-base py-2.5 font-semibold`}
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Description <span className="text-red-400">*</span></label>
                  <textarea
                    name="description"
                    defaultValue={product?.description}
                    required
                    rows={4}
                    placeholder="A short, customer-facing description."
                    className={`${textInput} resize-none`}
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Category</label>
                  {categories.length > 0 ? (
                    <select
                      name="categoryId"
                      // Falling back to categories[0] meant an uncategorised product DISPLAYED
                      // as being in the store's first category, and saving the form — even to
                      // fix a typo in the name — silently filed it there. With no empty option
                      // a category also could not be removed once set. saveProduct already
                      // maps "" to null, so the empty option below is all that was missing.
                      defaultValue={product?.categoryId ?? ''}
                      className={`${textInput} bg-white`}
                    >
                      <option value="">— Uncategorised —</option>
                      {categories.filter((c) => c.parentId === null).map((parent) => {
                        const children = categories.filter((c) => c.parentId === parent.id);
                        if (children.length === 0) {
                          return <option key={parent.id} value={parent.id}>{parent.label}</option>;
                        }
                        return (
                          <optgroup key={parent.id} label={parent.label}>
                            <option value={parent.id}>{parent.label} (all)</option>
                            {children.map((child) => (
                              <option key={child.id} value={child.id}>{child.label}</option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  ) : (
                    <div className={`${textInput} bg-gray-50 text-gray-500 flex items-center justify-between gap-2`}>
                      <span>No categories yet</span>
                      <Link
                        href="/categories"
                        target="_blank"
                        className="text-[#c96a3a] font-medium hover:underline whitespace-nowrap"
                      >
                        + Add one
                      </Link>
                    </div>
                  )}
                </div>

                <div className="h-px bg-stone-100" />

                <div>
                  <label className={fieldLabel}>Shared product gallery</label>
                  <p className="text-xs text-gray-400 mt-1 mb-3">Available to every option. Visual variant photos appear first, followed by the cover and these photos.</p>
                  <input type="hidden" name="images" value={JSON.stringify(galleryImages)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                    {galleryImages.map((url, i) => (
                      <div key={i} className="relative min-w-0">
                        <ImageUploader
                          value={url}
                          onChange={(newUrl) => {
                            const next = [...galleryImages];
                            next[i] = newUrl;
                            setGalleryImages(next);
                          }}
                          enableCrop
                          cardAspect={cardAspect}
                        />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(galleryImages.filter((_, j) => j !== i))}
                          className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-1.5 text-gray-500 shadow-sm ring-1 ring-black/10 hover:text-red-600 transition-colors"
                          title="Remove"
                          aria-label={`Remove gallery image ${i + 1}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setGalleryImages([...galleryImages, ''])}
                      className="min-h-24 sm:aspect-[4/5] flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-stone-300 rounded-xl text-[13px] font-semibold text-stone-500 hover:border-[#c96a3a]/50 hover:text-[#c96a3a] hover:bg-[#c96a3a]/[0.02] transition-colors"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-lg leading-none">+</span>
                      Add photo
                    </button>
                  </div>
                </div>

                <div className="h-px bg-stone-100" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabel}>Badge</label>
                    <input
                      name="tag"
                      defaultValue={product?.tag ?? ''}
                      placeholder="e.g. Bestseller, New"
                      className={textInput}
                    />
                    <p className="text-xs text-gray-400 mt-1">Single label shown on card &amp; detail page.</p>
                  </div>
                  <div>
                    <label className={fieldLabel}>Filter tags</label>
                    <input
                      name="tags"
                      defaultValue={(product?.tags ?? []).join(', ')}
                      placeholder="e.g. gift, wedding, bestseller"
                      className={textInput}
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated, for shop filtering.</p>
                  </div>
                </div>

                <div className="h-px bg-stone-100" />

                <div>
                  <SectionToggle
                    title="Physical details"
                    subtitle={physicalOpen ? 'Dimensions and materials/notes.' : 'Optional — not every product needs this (e.g. apparel).'}
                    open={physicalOpen}
                    onToggle={() => setPhysicalOpen(!physicalOpen)}
                  />

                  {physicalOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={fieldLabel}>Dimensions (cm)</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Width</span>
                            <input name="widthCm" type="number" min={0} step="0.1" defaultValue={product?.widthCm ?? ''} placeholder="0" className={numInput} />
                          </div>
                          <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Height</span>
                            <input name="heightCm" type="number" min={0} step="0.1" defaultValue={product?.heightCm ?? ''} placeholder="0" className={numInput} />
                          </div>
                          <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Depth</span>
                            <input name="depthCm" type="number" min={0} step="0.1" defaultValue={product?.depthCm ?? ''} placeholder="0" className={numInput} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Shown to customers on the product page. Leave blank if not applicable.</p>
                      </div>

                      <div>
                        <label className={fieldLabel}>Details (materials, notes)</label>
                        <input
                          name="details"
                          defaultValue={product?.details ?? ''}
                          placeholder="Optional notes — materials, care instructions, etc."
                          className={textInput}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Pricing & stock tab ──────────────────────────────────────── */}
            <div data-tab="pricing" className={panel('pricing')}>
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <SectionHeading icon={TAB_ICONS.pricing} title="Pricing" />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 max-w-[480px]">
                      <div>
                        <label className={fieldLabel}>Price (NPR){canSetPrice && !onRequest && <span className="text-red-400"> *</span>}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                          <input
                            name={onRequest ? undefined : 'priceNpr'}
                            type="number"
                            min={1}
                            required={canSetPrice && !onRequest}
                            value={onRequest ? '' : price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder={onRequest ? 'On request' : '0'}
                            disabled={!canSetPrice || onRequest}
                            className={`${numInput} pl-10 text-base font-semibold disabled:bg-gray-100 disabled:text-gray-400`}
                          />
                          {onRequest && <input type="hidden" name="priceNpr" value="0" />}
                        </div>
                        {canSetPrice ? (
                          <label className="mt-2 flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" name="priceOnRequest" value="1" checked={onRequest}
                              onChange={(e) => { setOnRequest(e.target.checked); setIsDirty(true); }}
                              className="rounded border-gray-300 text-[#c96a3a] focus:ring-[#c96a3a]" />
                            Price on request (customers ask instead of buying)
                          </label>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Managed by the store owner.</p>
                        )}
                      </div>
                      <div>
                        <label className={fieldLabel}>Unit cost (NPR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                          <input
                            name="costNpr"
                            type="number"
                            min={0}
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            placeholder="Optional"
                            disabled={!canSetPrice}
                            className={`${numInput} pl-10 disabled:bg-gray-100 disabled:text-gray-400`}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${margin !== null && margin < 20 ? 'text-amber-700' : 'text-gray-400'}`}>
                          {margin !== null
                            ? `${margin}% margin · NPR ${((Number(price) || 0) - (Number(cost) || 0)).toLocaleString()} per sale`
                            : 'What one unit costs you. Never shown to customers.'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabel}>Sale price (NPR)</label>
                      <div className="relative max-w-[200px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                        <input
                          name="compareAtPriceNpr"
                          type="number"
                          min={0}
                          defaultValue={product?.compareAtPriceNpr ?? ''}
                          placeholder="None"
                          disabled={!canSetPrice}
                          className={`${numInput} pl-10 disabled:bg-gray-100 disabled:text-gray-400`}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {canSetPrice
                          ? 'Optional "original" price shown struck through, e.g. for a seasonal promo. Must be higher than the price above to show.'
                          : 'Managed by the store owner.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <SectionHeading
                    icon="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"
                    title="Inventory"
                    subtitle={isNew ? 'How many you have on hand now. The shop stops selling at 0.' : 'Stock is set once here, then tracked as batches — see the Inventory panel.'}
                  />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Stock qty</label>
                        {isNew ? (
                          <input
                            name={untracked ? undefined : 'stockQty'}
                            type="number" min={0}
                            required={!untracked}
                            disabled={untracked}
                            defaultValue={currentStockQty ?? ''}
                            placeholder={untracked ? 'Not tracked' : 'e.g. 10'}
                            className={`${numInput} disabled:bg-gray-100 disabled:text-gray-400`}
                          />
                        ) : (
                          <>
                            {/* Deliberately not a form field on edit: every save used to
                                resubmit whatever number was on screen when the page
                                loaded, silently clobbering any restock/adjustment made
                                in the Inventory panel (or by a sale) in the meantime.
                                Read-only here; the Inventory panel is the only place
                                this number actually changes, so it can't go stale. */}
                            <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                              {untracked ? 'Not tracked' : currentStockQty == null ? 'Tracked from 0 after save' : `${currentStockQty} in stock`}
                            </div>
                            {/* The panel now always lives in the left rail (visible
                                alongside every tab), so a plain anchor scroll works
                                unconditionally — no tab-switching needed. */}
                            <a href="#inventory-panel" className="text-xs text-[#c96a3a] hover:underline mt-1 inline-block">
                              Manage stock in the Inventory panel →
                            </a>
                          </>
                        )}
                      </div>
                      <div>
                        <label className={fieldLabel}>Reorder point</label>
                        <input name="reorderPoint" type="number" min={0} defaultValue={product?.reorderPoint ?? 0} placeholder="0" className={numInput} />
                        <p className="text-xs text-gray-400 mt-1">Alert when stock ≤ this.</p>
                      </div>
                    </div>

                    <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox" checked={untracked}
                        onChange={(e) => { setUntracked(e.target.checked); setIsDirty(true); }}
                        className="mt-0.5 rounded border-gray-300 text-[#c96a3a] focus:ring-[#c96a3a]"
                      />
                      <span>
                        Don&apos;t track stock — sell without limit
                        <span className="block text-gray-400">For made-to-order, digital, or service items only. Physical stock should be tracked.</span>
                      </span>
                    </label>
                    {!isNew && (
                      <input
                        type="hidden" name="stockTracking"
                        value={untracked === initiallyUntracked ? 'keep' : untracked ? 'untrack' : 'track'}
                      />
                    )}

                    <div>
                      <label className={fieldLabel}>Lead time (days)</label>
                      <input name="leadTimeDays" type="number" min={0} defaultValue={product?.leadTimeDays ?? ''} placeholder="Not applicable" className={`${numInput} max-w-[160px]`} />
                      <p className="text-xs text-gray-400 mt-1">
                        For handmade/made-to-order pieces. Shown to customers when out of stock.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <SectionHeading
                    icon="M3 3h18v18H3zM3 9h18M9 21V9"
                    title="Delivery fee override"
                    subtitle="Only used for phone/manual orders (Orders → New). Customer checkout doesn't charge delivery at all — that's confirmed with the customer and set on the order afterward."
                  />
                  <div className="max-w-[200px]">
                    <label className={fieldLabel}>Fee for this product (NPR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">NPR</span>
                      <input
                        name="deliveryFee"
                        type="number"
                        min={0}
                        defaultValue={product?.deliveryFee ?? ''}
                        placeholder="0"
                        className={`${numInput} pl-10`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Leave blank for no auto-filled fee (0). Enter a flat amount for bulkier pieces that cost more to ship.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Variants tab ─────────────────────────────────────────────── */}
            <div data-tab="variants" className={panel('variants')}>
              <div className="bg-white rounded-xl border border-stone-200 p-6">
                <input type="hidden" name="variants" value={variantsPayload} />
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <SectionHeading icon={TAB_ICONS.variants} title="Variants" subtitle="e.g. sizes, colors, or both — leave empty for a single-option product." className="mb-0 min-w-0" />
                  {!isColorSize && <button
                    type="button"
                    onClick={addVariant}
                    className="shrink-0 self-start rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-700"
                  >
                    + Add variant
                  </button>}
                </div>

                <div className="mb-4">
                    <label className={fieldLabel}>What do these options change?</label>
                    <select
                      name="variantAxis"
                      value={variantAxis}
                      onChange={(e) => changeAxis(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                    >
                      <option value="">Size / non-visual — same photos</option>
                      <option value="color">Color / pattern — variants look different</option>
                      <option value="style">Style / material — variants look different</option>
                      <option value="color_size">Color + Size — e.g. a shirt in 3 colors × 4 sizes</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {isColorSize
                        ? 'Shoppers pick a color, then a size. Each color × size pair has its own stock, price and SKU; one photo per color is shared by all its sizes.'
                        : 'Choose Color or Style when options look different. Their optional photos appear first in the storefront gallery; options without a photo use the shared gallery. Sizes keep the same shared photos.'}
                    </p>
                    {!variantAxis && variants.some((v) => v.image.trim()) && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <span className="mt-px">⚠</span>
                        <span>
                          {variants.filter((v) => v.image.trim()).length} variant photo{variants.filter((v) => v.image.trim()).length === 1 ? '' : 's'} uploaded,
                          but these options are set to non-visual — those photos won't show on the storefront. Choose Color or Style above if they represent different looks.
                        </span>
                      </div>
                    )}
                </div>

                {isColorSize && (
                  <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <label className={fieldLabel}>Colors</label>
                        <ChipListInput values={colorList} onChange={setColorList} placeholder="Type a color, press Enter" ariaLabel="Add a color" />
                      </div>
                      <div className="min-w-0">
                        <label className={fieldLabel}>Sizes</label>
                        <ChipListInput values={sizeList} onChange={setSizeList} placeholder="Type a size, press Enter" ariaLabel="Add a size" />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={buildCombinations}
                        disabled={colorList.length === 0 || sizeList.length === 0}
                        className="rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
                      >
                        {variants.length ? 'Update combinations' : 'Create combinations'}
                        {colorList.length > 0 && sizeList.length > 0 && ` (${colorList.length} × ${sizeList.length} = ${colorList.length * sizeList.length})`}
                      </button>
                      <span className="text-[11px] text-stone-500">Add as many colors and sizes as you need — one option is made per pair. Existing options keep their stock, prices and SKUs.</span>
                    </div>
                    {variants.some((v) => !v.color.trim() || !v.size.trim()) && (
                      <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <span className="mt-px">⚠</span>
                        <span>Some options are missing a color or size. Fill both on every option (or remove it) — until then the shop shows a single list.</span>
                      </p>
                    )}
                  </div>
                )}

                {variants.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                    <p className="text-sm text-gray-400">{isColorSize ? 'Enter colors and sizes above, then Create combinations.' : 'No variants — this product is sold as one option.'}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const base = skuInputRef.current?.value.trim() || suggestSku(nameInputRef.current?.value ?? '');
                          setVariants(variants.map((v) => (v.sku.trim() || !v.label.trim() ? v : { ...v, sku: suggestSku(base, v.label) })));
                          setIsDirty(true);
                        }}
                        className="text-xs font-medium text-[#c96a3a] hover:underline"
                      >
                        Fill empty SKUs
                      </button>
                    </div>
                    {variants.map((v, idx) => {
                      // Server-side record for this row, if it's been saved before —
                      // the source of truth for stock once restocks/adjustments can
                      // have happened to it (see stockQty comment on the Pricing tab).
                      const persisted = !isNew && v.id ? (product?.variants ?? []).find((pv) => pv.id === v.id) : undefined;
                      const stockQty = persisted?.stockQty ?? null;
                      const isExpanded = expandedStockId === v.id;
                      const sharedPhotos = [
                        { url: image, label: 'Cover image' },
                        ...galleryImages.map((url, photoIndex) => ({ url, label: `Shared photo ${photoIndex + 1}` })),
                      ].filter((photo): photo is { url: string; label: string } => Boolean(photo.url));
                      const selectedSharedPhoto = sharedPhotos.some((photo) => photo.url === v.image);
                      return (
                        <div key={idx} className="rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 space-y-4">
                          <div className={`grid min-w-0 ${hasVisualVariants ? 'grid-cols-[72px_minmax(0,1fr)_32px]' : 'grid-cols-[auto_minmax(0,1fr)_32px]'} items-center gap-3`}>
                            {hasVisualVariants ? (
                              <div className="space-y-1 text-center">
                                <VariantImageCell value={v.image} onChange={(url) => updateVariant(idx, { image: url })} cardAspect={cardAspect} />
                                <span className="block text-[10px] font-medium text-stone-500">Variant photo</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1.5 text-[11px] font-medium text-stone-500">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                                Shared gallery
                              </span>
                            )}
                            {isColorSize ? (
                              <div className="grid min-w-0 grid-cols-2 gap-2">
                                <div className="min-w-0">
                                  <label className={fieldLabel}>Color</label>
                                  <input
                                    value={v.color}
                                    onChange={(e) => updateVariant(idx, { color: e.target.value })}
                                    placeholder="e.g. Red"
                                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <label className={fieldLabel}>Size</label>
                                  <input
                                    value={v.size}
                                    onChange={(e) => updateVariant(idx, { size: e.target.value })}
                                    placeholder="e.g. M"
                                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <label className={fieldLabel}>Option label</label>
                                <input
                                  value={v.label}
                                  onChange={(e) => updateVariant(idx, { label: e.target.value })}
                                  placeholder="e.g. Red / L"
                                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              title="Remove variant"
                              aria-label={`Remove ${v.label.trim() || 'variant'}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>

                          {hasVisualVariants && (
                            <div className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-stone-700">{isColorSize ? `Photo for ${v.color.trim() || 'this color'}` : 'Photo for this look'} <span className="font-normal text-stone-400">(optional{isColorSize ? ' — shared by all its sizes' : ''})</span></p>
                                <p className="mt-0.5 text-[11px] text-stone-500">Click the thumbnail to upload, or reuse a photo from the shared gallery.</p>
                              </div>
                              <select
                                value={selectedSharedPhoto ? v.image : (v.image ? '__uploaded__' : '')}
                                onChange={(e) => updateVariant(idx, { image: e.target.value === '__uploaded__' ? v.image : e.target.value })}
                                aria-label={`Choose a shared photo for ${v.label || 'this option'}`}
                                className="w-full max-w-sm rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                              >
                                <option value="">Use shared gallery</option>
                                {sharedPhotos.map((photo, photoIndex) => (
                                  <option key={`${photo.url}-${photoIndex}`} value={photo.url}>{photo.label}</option>
                                ))}
                                {v.image && !selectedSharedPhoto && <option value="__uploaded__">Uploaded variant photo</option>}
                              </select>
                            </div>
                          )}

                          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="min-w-0">
                              <label className={fieldLabel}>Price (NPR)</label>
                              <input
                                value={v.priceNpr}
                                onChange={(e) => updateVariant(idx, { priceNpr: e.target.value })}
                                placeholder="Use product price"
                                inputMode="numeric"
                                disabled={!canSetPrice}
                                title="Blank = use the product's price"
                                className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className={fieldLabel}>Unit cost (NPR)</label>
                              <input
                                value={v.costNpr}
                                onChange={(e) => updateVariant(idx, { costNpr: e.target.value })}
                                placeholder="Use product cost"
                                inputMode="numeric"
                                disabled={!canSetPrice}
                                title="Blank = use the product's unit cost"
                                className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className={fieldLabel}>SKU</label>
                              <input
                                value={v.sku}
                                onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                                placeholder="Optional SKU"
                                className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                              />
                            </div>
                          </div>

                          {/* Stock: editable on create (or for a variant added this
                              session that hasn't been saved yet), otherwise read-only
                              with Restock/Adjust — same reasoning as the product-level
                              Stock qty field on the Pricing tab. */}
                          {!persisted ? (
                            <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
                              <input
                                value={v.untracked ? '' : v.stockQty}
                                onChange={(e) => updateVariant(idx, { stockQty: e.target.value })}
                                placeholder={v.untracked ? 'Not tracked' : 'Stock on hand'}
                                inputMode="numeric"
                                disabled={v.untracked}
                                className="w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
                              />
                              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                <input type="checkbox" checked={v.untracked}
                                  onChange={(e) => updateVariant(idx, { untracked: e.target.checked })}
                                  className="rounded border-gray-300 text-[#c96a3a] focus:ring-[#c96a3a]" />
                                Don&apos;t track
                              </label>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                stockQty === null ? 'bg-stone-100 text-stone-500' :
                                stockQty === 0 ? 'bg-red-50 text-red-600' :
                                'bg-green-50 text-green-700'
                              }`}>
                                {stockQty === null ? 'Not tracked' : stockQty === 0 ? 'Out of stock' : `${stockQty} in stock`}
                              </span>
                              <button
                                type="button"
                                onClick={() => setExpandedStockId(isExpanded ? null : v.id!)}
                                className="text-xs font-medium text-[#c96a3a] hover:underline"
                              >
                                {isExpanded ? 'Close' : 'Manage stock'}
                              </button>
                            </div>
                          )}

                          {persisted && isExpanded && (
                            <VariantStockControls productId={product!.id} variantId={v.id!} stockQty={stockQty} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">Blank price or cost = use the product&apos;s. Blank stock on a new option = 0 — tick &ldquo;Don&apos;t track&rdquo; only for made-to-order options.</p>
              </div>
            </div>

            {/* ── Settings tab ─────────────────────────────────────────────── */}
            <div data-tab="settings" className={panel('settings')}>
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <SectionHeading icon={TAB_ICONS.settings} title="Organize" subtitle="Draft and Archived now live in Visibility, at the top." />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabel}>Sort order</label>
                      <input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} className={numInput} />
                      <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <SectionToggle
                    title="Advance payment"
                    subtitle={advanceOpen ? 'Require a partial payment before production begins.' : 'Optional — for made-to-order or custom pieces.'}
                    open={advanceOpen}
                    onToggle={() => setAdvanceOpen(!advanceOpen)}
                  />

                  {advanceOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={fieldLabel}>Type</label>
                        <select
                          name="prepaymentType"
                          value={prepaymentType}
                          onChange={(e) => setPrepaymentType(e.target.value as PrepaymentType)}
                          className={`${textInput} bg-white`}
                        >
                          <option value="none">No advance required</option>
                          <option value="percentage">Percentage of price</option>
                          <option value="fixed">Fixed NPR amount</option>
                        </select>
                      </div>

                      {prepaymentType !== 'none' && (
                        <div>
                          <label className={fieldLabel}>
                            {prepaymentType === 'percentage' ? 'Percentage (%)' : 'Amount (NPR)'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                              {prepaymentType === 'percentage' ? '%' : 'NPR'}
                            </span>
                            <input
                              name="prepaymentValue"
                              type="number"
                              min={0}
                              max={prepaymentType === 'percentage' ? 100 : undefined}
                              defaultValue={product?.prepaymentValue ?? (prepaymentType === 'percentage' ? 10 : 0)}
                              className={`${numInput} pl-10`}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {prepaymentType === 'percentage'
                              ? 'Customer will be shown this % of the product price as the advance amount.'
                              : 'Customer will be shown this fixed NPR amount as the advance payment.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {prepaymentType === 'none' && (
                    <input type="hidden" name="prepaymentValue" value="0" />
                  )}
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Digital product</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Enable if this is a downloadable file — no physical shipping.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDigital"
                      name="isDigital"
                      value="true"
                      checked={isDigital}
                      onChange={(e) => setIsDigital(e.target.checked)}
                      className="w-4 h-4 accent-[#c96a3a]"
                    />
                    <label htmlFor="isDigital" className="text-sm text-gray-700">Digital product (no physical shipping)</label>
                  </div>
                  {!isDigital && <input type="hidden" name="isDigital" value="false" />}
                  {isDigital && (
                    <div>
                      <label className={fieldLabel}>Download URL</label>
                      <input
                        type="url"
                        name="digitalAssetUrl"
                        value={digitalAssetUrl}
                        onChange={(e) => setDigitalAssetUrl(e.target.value)}
                        placeholder="https://example.com/file.pdf"
                        className={textInput}
                      />
                      <p className="text-xs text-gray-400 mt-1">Sent to the customer after delivery is confirmed.</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <SectionToggle
                    title="SEO"
                    subtitle={seoOpen ? 'Custom title and description for search engines.' : 'Optional — override the auto-generated search preview.'}
                    open={seoOpen}
                    onToggle={() => setSeoOpen(!seoOpen)}
                  />

                  {seoOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={fieldLabel}>
                          Meta title <span className="normal-case font-normal text-gray-400">(max 120 chars)</span>
                        </label>
                        <input
                          name="metaTitle"
                          defaultValue={product?.metaTitle ?? ''}
                          maxLength={120}
                          placeholder="Leave blank to auto-generate from the product name"
                          className={textInput}
                        />
                        <p className="text-xs text-gray-400 mt-1">Shown as the clickable headline in Google results. ~50–60 chars is ideal.</p>
                      </div>

                      <div>
                        <label className={fieldLabel}>
                          Meta description <span className="normal-case font-normal text-gray-400">(max 320 chars)</span>
                        </label>
                        <textarea
                          name="metaDescription"
                          defaultValue={product?.metaDescription ?? ''}
                          maxLength={320}
                          rows={3}
                          placeholder="Leave blank to auto-generate from the product description"
                          className={`${textInput} resize-none`}
                        />
                        <p className="text-xs text-gray-400 mt-1">Shown below the title in Google results. ~150–160 chars is ideal.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </form>
  );
}
