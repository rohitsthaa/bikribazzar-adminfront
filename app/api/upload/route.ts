import { NextResponse } from 'next/server';
import { currentStoreId } from '@/lib/store-context';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

export async function POST(req: Request) {
  try {
    if (!TOKEN) {
      return NextResponse.json({ error: 'API_INTERNAL_TOKEN is not configured.' }, { status: 500 });
    }

    const storeId = await currentStoreId();
    const formData = await req.formData();

    let upstream: Response;
    try {
      upstream = await fetch(`${API_BASE}/uploads`, {
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

    // Guard: API may return an HTML error page (nginx 502/504) — don't call .json() blindly.
    const contentType = upstream.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await upstream.text().catch(() => '(no body)');
      console.error(`[upload proxy] Non-JSON response ${upstream.status}:`, text.slice(0, 300));
      return NextResponse.json(
        { error: `Upload API returned unexpected response (${upstream.status}).` },
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
