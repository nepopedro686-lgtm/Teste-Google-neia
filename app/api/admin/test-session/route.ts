import { NextResponse } from 'next/server';
import { isTestAdminAuthenticated } from '@/lib/test-store';

export async function GET() {
  const authenticated = await isTestAdminAuthenticated();
  return NextResponse.json({ authenticated });
}
