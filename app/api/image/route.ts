import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src) return new Response('Missing src', { status: 400 });

  try {
    // Our own uploaded files are stored as absolute URLs pointing at the API
    // (e.g. https://api.../uploads/{guid}.jpg), but the API host reachable
    // from here isn't always the same as the one baked into the stored URL
    // (Docker-internal vs. public hostname) — so for THOSE we deliberately
    // discard the stored host and refetch the path against our own API_BASE.
    //
    // Demo/seed products (see bikribazzar-api DbInitializer) use real
    // external placeholder images (picsum.photos) that were never uploaded
    // to our API at all. Stripping their host and refetching against
    // API_BASE 404s, since that path means nothing to our API. For any URL
    // that isn't one of our own /uploads/ paths, fetch it as given instead.
    let upstreamUrl: string;
    if (src.startsWith('http')) {
      const parsed = new URL(src);
      upstreamUrl = parsed.pathname.startsWith('/uploads/') ? `${API_BASE}${parsed.pathname}` : src;
    } else {
      upstreamUrl = `${API_BASE}${src}`;
    }

    const upstream = await fetch(upstreamUrl, { cache: 'force-cache' });
    if (!upstream.ok) return new Response('Not found', { status: 404 });

    const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Failed to fetch image', { status: 502 });
  }
}
