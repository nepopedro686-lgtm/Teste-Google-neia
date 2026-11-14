import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import {
  DEFAULT_STORE_SETTINGS,
  DEMO_SAMPLE_DRESSES,
  Dress,
  StoreSettings,
} from './types';

export const TEST_COOKIE_NAME = 'neia_test_session';
const TEST_DB_DIR = '/tmp/neia-test-db';
const TEST_STORE_FILE = path.join(TEST_DB_DIR, 'store.json');
const TEST_MEDIA_DIR = path.join(TEST_DB_DIR, 'media');

interface TestStoreData {
  settings: StoreSettings;
  dresses: Dress[];
}

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.APP_URL ||
    'neia-concept-local-test-session-key'
  );
}

export function getExpectedTestPassword(): string {
  return process.env.ADMIN_TEST_PASSWORD || 'neia28';
}

export function verifyTestPassword(candidate: string): boolean {
  const expected = getExpectedTestPassword();
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function signTestSessionToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24; // 24h
  const payload = Buffer.from(JSON.stringify({ role: 'test_admin', exp })).toString(
    'base64url'
  );
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyTestSessionToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'test_admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isTestAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEST_COOKIE_NAME)?.value;
  return verifyTestSessionToken(token);
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(TEST_DB_DIR, { recursive: true });
  await fs.mkdir(TEST_MEDIA_DIR, { recursive: true });
}

export async function hasInitializedTestStore(): Promise<boolean> {
  try {
    await fs.access(TEST_STORE_FILE);
    return true;
  } catch {
    return false;
  }
}

export async function readTestStore(): Promise<TestStoreData> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(TEST_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TestStoreData>;
    return {
      settings: {
        ...DEFAULT_STORE_SETTINGS,
        ...(parsed.settings || {}),
      },
      dresses: Array.isArray(parsed.dresses) ? parsed.dresses : [],
    };
  } catch {
    const now = new Date().toISOString();
    const initial: TestStoreData = {
      settings: { ...DEFAULT_STORE_SETTINGS, hideDemoExamples: true, updatedAt: now },
      dresses: DEMO_SAMPLE_DRESSES.map((d) => ({
        ...d,
        createdAt: now,
        updatedAt: now,
      })),
    };
    await fs.writeFile(TEST_STORE_FILE, JSON.stringify(initial), 'utf8');
    return initial;
  }
}

export async function writeTestStore(data: TestStoreData): Promise<void> {
  await ensureDirs();
  await fs.writeFile(TEST_STORE_FILE, JSON.stringify(data), 'utf8');
}

export async function saveTestMedia(
  mediaId: string,
  payload: { dataBase64: string; mimeType: string }
): Promise<void> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(mediaId)) {
    throw new Error('ID de mídia inválido.');
  }
  await ensureDirs();
  const filePath = path.join(TEST_MEDIA_DIR, `${mediaId}.json`);
  await fs.writeFile(filePath, JSON.stringify(payload), 'utf8');
}

export async function readTestMedia(
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(mediaId)) {
    return null;
  }
  try {
    const filePath = path.join(TEST_MEDIA_DIR, `${mediaId}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as { dataBase64?: string; mimeType?: string };
    if (!parsed.dataBase64) return null;
    return {
      buffer: Buffer.from(parsed.dataBase64, 'base64'),
      mimeType: parsed.mimeType || 'image/webp',
    };
  } catch {
    return null;
  }
}
