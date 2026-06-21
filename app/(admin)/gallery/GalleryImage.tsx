'use client';

export default function GalleryImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/image?src=${encodeURIComponent(src)}`}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
