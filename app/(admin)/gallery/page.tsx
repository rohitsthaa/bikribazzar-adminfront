import { getGalleryImages } from '@/lib/api';
import { addGalleryImage, removeGalleryImage } from './actions';
import AddGalleryForm from './AddGalleryForm';
import GalleryImage from './GalleryImage';
import EmptyState from '@/components/EmptyState';

export const metadata = { title: 'Gallery — Soul Thread Admin' };

export default async function GalleryPage() {
  const images = await getGalleryImages();
  const isEmpty = images.length === 0;

  return (
    <main className="p-6 md:p-8 max-w-6xl">
        <div className="flex items-start gap-3 mb-6">
          <span className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-[#c96a3a]/10 text-[#c96a3a] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Gallery</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {images.length} {images.length === 1 ? 'image' : 'images'} · shown on the site's gallery page
            </p>
          </div>
        </div>

        {/* Add image — permanently visible, matching Testimonials (the other
            page with a short, single-item add-form). Adding photos is a
            routine action here, not an edge case worth hiding behind a
            disclosure toggle — an accordion was the wrong pattern; nothing
            else in the admin uses one for its "add" affordance. */}
        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 mb-8">
          <h2 className="flex items-center gap-2 font-semibold text-stone-900 text-sm mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
            </svg>
            Add image
          </h2>
          <AddGalleryForm action={addGalleryImage} />
        </div>

        {/* Grid */}
        {isEmpty ? (
          <EmptyState
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            }
            title="No images yet"
            body="Photos you add above will show up here, and on the site's gallery page."
          />
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
                {/* Caption — alt text only. The raw storage URL used to be
                    printed here too, which is meaningless to a non-technical
                    store owner and reads as unfinished/technical debris. */}
                <div className="px-3 py-2.5">
                  {img.alt ? (
                    <p className="text-xs font-medium text-stone-700 truncate">{img.alt}</p>
                  ) : (
                    <p className="text-xs text-stone-300 italic truncate">No alt text</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}
