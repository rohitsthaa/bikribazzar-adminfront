import { getGalleryImages } from '@/lib/api';
import { addGalleryImage, removeGalleryImage } from './actions';
import AddGalleryForm from './AddGalleryForm';
import GalleryImage from './GalleryImage';

export const metadata = { title: 'Gallery — Soul Thread Admin' };

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <main className="p-6 md:p-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">Gallery</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </p>
        </div>

        {/* Add image — collapsible card, default open */}
        <details open className="mb-8 group">
          <summary className="flex items-center justify-between cursor-pointer list-none bg-white rounded-2xl border border-stone-200 px-6 py-4 hover:bg-stone-50 transition-colors select-none">
            <span className="font-semibold text-stone-900 text-sm">Add Image</span>
            <span className="text-stone-400 text-xs group-open:rotate-180 transition-transform inline-block">
              ▼
            </span>
          </summary>
          <div className="bg-white border border-t-0 border-stone-200 rounded-b-2xl px-6 py-5">
            <AddGalleryForm action={addGalleryImage} />
          </div>
        </details>

        {/* Grid */}
        {images.length === 0 ? (
          <p className="text-center text-stone-400 py-16 text-sm">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden"
              >
                {/* Square image */}
                <div className="aspect-square bg-stone-100 relative overflow-hidden">
                  <GalleryImage src={img.url} alt={img.alt || 'Gallery image'} />
                  {/* Hover overlay with Remove button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <form action={removeGalleryImage.bind(null, img.id)}>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-white text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors shadow-md"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
                {/* Caption */}
                {(img.alt || img.url) && (
                  <div className="px-3 py-2.5">
                    {img.alt && (
                      <p className="text-xs font-medium text-stone-700 truncate">{img.alt}</p>
                    )}
                    <p className="text-xs text-stone-400 truncate mt-0.5">{img.url}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </main>
  );
}
