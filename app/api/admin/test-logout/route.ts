import { NextResponse } from 'next/server';
import { TEST_COOKIE_NAME } from '@/lib/test-store';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TEST_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
