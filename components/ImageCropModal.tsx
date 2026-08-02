'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImageBlob, type CropPixels } from '@/lib/cropImage';
import { cardAspectFor, DETAIL_ASPECT } from '@/lib/template-aspects';

// Fixed at 4:5 — matches the storefront's product-detail photo on every
// template, and most templates' shop-grid card too (see lib/template-aspects.ts).
// Not user-adjustable: letting merchants pick an arbitrary aspect would bring
// back the original problem (guessing what actually shows), just one step
// removed.
const CROP_ASPECT = 4 / 5;

type Props = {
  // Object URL (freshly picked file) or a same-origin blob URL (re-cropping
  // an already-uploaded image, fetched by the caller) — must not be a raw
  // cross-origin URL or the canvas export below will be tainted and throw.
  imageSrc: string;
  templateId?: string;
  // 'product' (primary/gallery images): previews show the shop-grid card
  // and the product page, since that's everywhere those images appear.
  // 'variant': variant photos never show on the card — on the storefront
  // they render as a round color/style swatch (components/ProductActions.tsx,
  // 44px circle) and, once selected, swap into the same 4:5 product-page
  // photo. So the first preview becomes a circular swatch instead.
  mode?: 'product' | 'variant';
  onCancel: () => void;
  onSave: (blob: Blob) => void;
};

export default function ImageCropModal({ imageSrc, templateId, mode = 'product', onCancel, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<CropPixels | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  // Cheap low-res render for the "how this will look" boxes below — recomputed
  // whenever the crop/zoom settles, so those previews stay live as you adjust.
  useEffect(() => {
    if (!areaPixels) return;
    let cancelled = false;
    getCroppedImageBlob(imageSrc, areaPixels, 400)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [imageSrc, areaPixels]);

  // Revoke the last preview URL on unmount so we don't leak blob URLs across
  // repeated open/close cycles of this modal.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function handleSave() {
    if (!areaPixels) return;
    setSaving(true);
    setError('');
    try {
      const blob = await getCroppedImageBlob(imageSrc, areaPixels, 1600);
      onSave(blob);
    } catch {
      setError('Could not crop this image — try a different photo.');
      setSaving(false);
    }
  }

  const cardAspect = cardAspectFor(templateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-semibold text-stone-900">Crop image</h2>
            <p className="text-xs text-stone-400 mt-0.5">Fixed at 4:5 — matches the product page on every store theme.</p>
          </div>
          <button type="button" onClick={onCancel} className="text-stone-400 hover:text-stone-700 transition-colors">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="relative w-full h-72 bg-stone-900 rounded-xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={CROP_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#c96a3a]"
            />
          </div>

          {/* WYSIWYG — the actual frames this crop will land in on the storefront */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">How this will look on your storefront</p>
            <div className="flex gap-4">
              {mode === 'variant' ? (
                <PreviewBox label="Color/style swatch" aspect="1/1" shape="circle" boxClassName="max-w-[88px]" url={previewUrl} />
              ) : (
                <PreviewBox label="Shop grid card" aspect={cardAspect} url={previewUrl} />
              )}
              <PreviewBox label="Product page" aspect={DETAIL_ASPECT} url={previewUrl} />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100">
          <button type="button" onClick={onCancel} className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!areaPixels || saving}
            className="bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Use this crop'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewBox({ label, aspect, url, shape = 'rect', boxClassName }: {
  label: string;
  aspect: string;
  url: string;
  shape?: 'rect' | 'circle';
  boxClassName?: string;
}) {
  return (
    <div className={boxClassName ? '' : 'flex-1'}>
      <div
        className={`border border-stone-200 bg-stone-100 overflow-hidden ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} ${boxClassName ?? 'w-full'}`}
        style={{ aspectRatio: aspect }}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <p className="text-xs text-stone-400 mt-1 text-center">{label}{shape === 'rect' && ` · ${aspect}`}</p>
    </div>
  );
}
