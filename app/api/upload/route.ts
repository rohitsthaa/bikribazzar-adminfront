import { NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.API_INTERNAL_TOKEN ?? '';

export async function POST(req: Request) {
  const formData = await req.formData();
  const upstream = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: { 'x-internal-token': TOKEN },
    body: formData,
  });
  const json = await upstream.json();
  return NextResponse.json(json, { status: upstream.status });
}
