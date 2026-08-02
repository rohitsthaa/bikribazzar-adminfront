// Canvas-based image cropping — takes a source image + a pixel crop rect
// (as reported by react-easy-crop's onCropComplete) and renders just that
// rect to a new, smaller image. Used by ImageCropModal so what gets uploaded
// is the actual cropped photo, not the original with crop metadata attached.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    // Only matters for cross-origin URLs; harmless for blob:/data: URLs.
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export type CropPixels = { x: number; y: number; width: number; height: number };

// maxOutputWidth caps the exported image size — product photos are often
// several thousand pixels wide, and nothing on the storefront ever displays
// wider than this, so there's no reason to keep uploading (and storing) the
// full original resolution.
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: CropPixels,
  maxOutputWidth = 1600,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const outputWidth = Math.round(Math.min(crop.width, maxOutputWidth));
  const outputHeight = Math.round(outputWidth * (crop.height / crop.width));

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported in this browser');

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, outputWidth, outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export cropped image'))),
      'image/jpeg',
      0.9,
    );
  });
}
