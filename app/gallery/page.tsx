import Nav from '@/components/Nav';
import { getGalleryImages } from '@/lib/api';
import { addGalleryImage, removeGalleryImage } from './actions';
import AddGalleryForm from './AddGalleryForm';
import GalleryImage from './GalleryImage';

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-xl font-semibold mb-6">Gallery</h1>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Add image</h2>
          <AddGalleryForm action={addGalleryImage} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.length === 0 && (
            <p className="col-span-3 text-center text-gray-400 py-12 text-sm">No images yet.</p>
          )}
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <GalleryImage src={img.url} alt={img.alt || 'Gallery image'} />
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-500 truncate mb-1">{img.url}</p>
                {img.alt && <p className="text-xs text-gray-400 truncate mb-2">{img.alt}</p>}
                <form action={removeGalleryImage.bind(null, img.id)}>
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
