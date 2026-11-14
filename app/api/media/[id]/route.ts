import { NextRequest, NextResponse } from 'next/server';
import { fetchMediaAssetById } from '@/lib/firestore-public';
import { readTestMedia } from '@/lib/test-store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
  }

  const asset = id.startsWith('testimg-')
    ? await readTestMedia(id)
    : (await fetchMediaAssetById(id)) ?? (await readTestMedia(id));

  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.buffer), {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
