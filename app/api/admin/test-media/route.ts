import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isTestAdminAuthenticated, saveTestMedia } from '@/lib/test-store';

export async function POST(req: NextRequest) {
  if (!(await isTestAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      dataBase64?: unknown;
      mimeType?: unknown;
    };
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';

    if (
      !dataBase64 ||
      dataBase64.length > 900000 ||
      !['image/webp', 'image/jpeg', 'image/png'].includes(mimeType)
    ) {
      return NextResponse.json({ error: 'Arquivo de imagem inválido.' }, { status: 400 });
    }

    const mediaId = `testimg-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    await saveTestMedia(mediaId, { dataBase64, mimeType });
    return NextResponse.json({ url: `/api/media/${mediaId}` });
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar imagem.' }, { status: 500 });
  }
}
