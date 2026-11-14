import { NextRequest, NextResponse } from 'next/server';
import {
  signTestSessionToken,
  TEST_COOKIE_NAME,
  verifyTestPassword,
} from '@/lib/test-store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password || !verifyTestPassword(password)) {
      return NextResponse.json({ error: 'Senha inválida.' }, { status: 401 });
    }

    const token = signTestSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(TEST_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }
}
