import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { currentStoreId } from '@/lib/store-context';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!TOKEN) {
      return NextResponse.json({ error: 'API_INTERNAL_TOKEN is not configured.' }, { status: 500 });
    }

    const storeId = await currentStoreId();
    const formData = await req.formData();
    const file = formData.get('file');

    if (file instanceof File) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File exceeds 10 MB limit.' }, { status: 413 });
      }

      // Keep animated GIFs intact. Normalize photos and other still images before
      // they reach storage so storefronts don't have to fetch multi-megabyte originals.
      if (!file.name.toLowerCase().endsWith('.gif')) {
        try {
          const input = Buffer.from(await file.arrayBuffer());
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          let pipeline = sharp(input, {
            limitInputPixels: 80_000_000,
          }).rotate();

          // Preserve hard edges in QR codes and logos: PNGs use lossless WebP and
          // retain crisp pixels while still bounding oversized uploads. Photo formats
          // use lossy WebP for smaller files.
          if (isPng) {
            pipeline = pipeline
              .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
              .webp({ lossless: true, effort: 4 });
          } else {
            pipeline = pipeline
              .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 82, effort: 4 });
          }
          const optimized = await pipeline.toBuffer();

          const optimizedName = `${file.name.replace(/\.[^.]+$/, '') || 'image'}.webp`;
          formData.set('file', new File([new Uint8Array(optimized)], optimizedName, { type: 'image/webp' }));
        } catch {
          return NextResponse.json({ error: 'Could not read this image. Try a JPG, PNG, or WebP file.' }, { status: 400 });
        }
      }
    }

    let upstream: Response;
    try {
      upstream = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers: {
          'x-internal-token': TOKEN,
          'x-store-id': storeId,
        },
        body: formData,
      });
    } catch (networkErr) {
      console.error('[upload proxy] Could not reach API:', networkErr);
      return NextResponse.json(
        { error: `Could not reach upload API at ${API_BASE}. Check API_BASE_URL.` },
        { status: 502 },
      );
    }

    // Map well-known nginx/proxy error codes to user-friendly messages.
    if (upstream.status === 413) {
      return NextResponse.json(
        { error: 'File is too large. Please upload an image under 10 MB.' },
        { status: 413 },
      );
    }
    if (upstream.status === 502 || upstream.status === 503 || upstream.status === 504) {
      return NextResponse.json(
        { error: 'Upload service is temporarily unavailable. Please try again.' },
        { status: 502 },
      );
    }

    // Guard: API may return an HTML error page — don't call .json() blindly.
    const contentType = upstream.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await upstream.text().catch(() => '(no body)');
      console.error(`[upload proxy] Non-JSON response ${upstream.status}:`, text.slice(0, 300));
      return NextResponse.json(
        { error: `Upload failed (${upstream.status}). Contact support if this persists.` },
        { status: 502 },
      );
    }

    const json = await upstream.json();
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    console.error('[upload proxy] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal error processing upload.' }, { status: 500 });
  }
}
