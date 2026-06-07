import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src) return new Response('Missing src', { status: 400 });

  try {
    const path = src.startsWith('http') ? new URL(src).pathname : src;
    const upstream = await fetch(`${API_BASE}${path}`, { cache: 'force-cache' });
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
