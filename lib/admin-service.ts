'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
  User,
} from 'firebase/auth';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  ADMIN_AUTH_EMAIL,
  DEFAULT_STORE_SETTINGS,
  DEMO_SAMPLE_DRESSES,
  Dress,
  DressAvailability,
  DressStatus,
  StoreSettings,
} from './types';
import { dressSchema, slugify, storeSettingsSchema } from './validation';
import { ProcessedImage } from './image-optimizer';

const BOOTSTRAPPED_GOOGLE_EMAIL = 'pedronepo097@gmail.com';

function isUsingTestMode(): boolean {
  return !auth.currentUser;
}

async function callTestStore<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/admin/test-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(json.error || 'Erro ao salvar no servidor de teste.');
  }
  return json;
}

function tsToIso(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return null;
}

function generateRandomId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 14)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${rand}`;
}

export async function signInWithTestPassword(password: string): Promise<boolean> {
  const res = await fetch('/api/admin/test-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export async function checkTestSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/test-session', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function signOutTestSession(): Promise<void> {
  await fetch('/api/admin/test-logout', { method: 'POST' });
}

export async function signInWithAdminPassword(password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, ADMIN_AUTH_EMAIL, password);
}

export async function signInWithAdminGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Sessão expirada. Entre novamente para alterar a senha.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export function checkIsUserAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase();
  if (emailLower === ADMIN_AUTH_EMAIL) return true;
  if (emailLower === BOOTSTRAPPED_GOOGLE_EMAIL && user.emailVerified) return true;
  return false;
}

export async function fetchAllDressesAdmin(): Promise<Dress[]> {
  if (isUsingTestMode()) {
    const res = await fetch('/api/admin/test-store', { cache: 'no-store' });
    if (!res.ok) throw new Error('Sessão de teste expirada.');
    const data = (await res.json()) as { dresses: Dress[] };
    return data.dresses || [];
  }

  try {
    const q = query(collection(db, 'dresses'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name ?? ''),
        slug: String(data.slug ?? ''),
        category: String(data.category ?? ''),
        description: String(data.description ?? ''),
        details: String(data.details ?? ''),
        currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : null,
        previousPrice: typeof data.previousPrice === 'number' ? data.previousPrice : null,
        mainImageUrl: String(data.mainImageUrl ?? ''),
        galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
        availability: (data.availability as DressAvailability) ?? 'available',
        status: (data.status as DressStatus) ?? 'draft',
        isDemo: Boolean(data.isDemo),
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
        createdBy: String(data.createdBy ?? ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'dresses');
  }
}

export interface DressInput {
  name: string;
  category: string;
  description: string;
  details: string;
  currentPrice: number | null;
  previousPrice: number | null;
  mainImageUrl: string;
  galleryImages: string[];
  availability: DressAvailability;
  status: DressStatus;
  isDemo?: boolean;
}

export async function createDress(
  input: DressInput,
  userUid: string,
  customSlug?: string
): Promise<string> {
  if (isUsingTestMode()) {
    const res = await callTestStore<{ id: string }>({
      action: 'create_dress',
      data: input,
    });
    return res.id;
  }

  const id = generateRandomId('vestido');
  const uniqueSuffix = id.slice(-5);
  const slug = customSlug || `${slugify(input.name)}-${uniqueSuffix}`;

  const parsed = dressSchema.parse({
    ...input,
    slug,
  });

  try {
    await setDoc(doc(db, 'dresses', id), {
      name: parsed.name,
      slug: parsed.slug,
      category: parsed.category,
      description: parsed.description,
      details: parsed.details,
      currentPrice: parsed.currentPrice,
      previousPrice: parsed.previousPrice,
      mainImageUrl: parsed.mainImageUrl,
      galleryImages: parsed.galleryImages,
      availability: parsed.availability,
      status: parsed.status,
      ...(parsed.isDemo ? { isDemo: true } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userUid,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `dresses/${id}`);
  }
}

export async function updateDress(
  id: string,
  existingSlug: string,
  input: DressInput
): Promise<void> {
  if (isUsingTestMode()) {
    await callTestStore({ action: 'update_dress', id, data: input });
    return;
  }

  const suffix = existingSlug.includes('-')
    ? existingSlug.split('-').pop() || id.slice(-5)
    : id.slice(-5);
  const nextSlug = `${slugify(input.name)}-${suffix}`;

  const parsed = dressSchema.parse({
    ...input,
    slug: nextSlug,
  });

  try {
    await updateDoc(doc(db, 'dresses', id), {
      name: parsed.name,
      slug: parsed.slug,
      category: parsed.category,
      description: parsed.description,
      details: parsed.details,
      currentPrice: parsed.currentPrice,
      previousPrice: parsed.previousPrice,
      mainImageUrl: parsed.mainImageUrl,
      galleryImages: parsed.galleryImages,
      availability: parsed.availability,
      status: parsed.status,
      isDemo: Boolean(parsed.isDemo),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `dresses/${id}`);
  }
}

export async function quickUpdateDressField(
  id: string,
  patch: Partial<Pick<Dress, 'availability' | 'status' | 'currentPrice'>>
): Promise<void> {
  if (isUsingTestMode()) {
    await callTestStore({ action: 'quick_update', id, patch });
    return;
  }

  try {
    await updateDoc(doc(db, 'dresses', id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `dresses/${id}`);
  }
}

export async function duplicateDress(dress: Dress, userUid: string): Promise<string> {
  if (isUsingTestMode()) {
    const res = await callTestStore<{ dress: Dress }>({
      action: 'duplicate_dress',
      id: dress.id,
    });
    return res.dress.id;
  }

  return createDress(
    {
      name: `${dress.name} (Cópia)`.slice(0, 120),
      category: dress.category,
      description: dress.description,
      details: dress.details,
      currentPrice: dress.currentPrice,
      previousPrice: dress.previousPrice,
      mainImageUrl: dress.mainImageUrl,
      galleryImages: dress.galleryImages,
      availability: dress.availability,
      status: 'draft',
      isDemo: dress.isDemo,
    },
    userUid
  );
}

export async function deleteDress(id: string): Promise<void> {
  if (isUsingTestMode()) {
    await callTestStore({ action: 'delete_dress', id });
    return;
  }

  try {
    await deleteDoc(doc(db, 'dresses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `dresses/${id}`);
  }
}

export async function uploadImageToMedia(
  processed: ProcessedImage,
  userUid: string
): Promise<string> {
  if (isUsingTestMode()) {
    const res = await fetch('/api/admin/test-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataBase64: processed.dataBase64,
        mimeType: processed.mimeType,
      }),
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      throw new Error(json.error || 'Erro ao enviar imagem.');
    }
    return json.url;
  }

  const mediaId = generateRandomId('img');
  try {
    await setDoc(doc(db, 'media', mediaId), {
      dataBase64: processed.dataBase64,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.sizeBytes,
      createdAt: serverTimestamp(),
      createdBy: userUid,
    });
    return `/api/media/${mediaId}`;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `media/${mediaId}`);
  }
}

export async function fetchStoreSettingsAdmin(): Promise<StoreSettings> {
  if (isUsingTestMode()) {
    const res = await fetch('/api/admin/test-store', { cache: 'no-store' });
    if (!res.ok) throw new Error('Sessão de teste expirada.');
    const data = (await res.json()) as { settings: StoreSettings };
    return data.settings || DEFAULT_STORE_SETTINGS;
  }

  try {
    const snap = await getDoc(doc(db, 'settings', 'store'));
    if (!snap.exists()) return DEFAULT_STORE_SETTINGS;
    const d = snap.data();
    return {
      storeName: String(d.storeName ?? DEFAULT_STORE_SETTINGS.storeName),
      logoUrl: String(d.logoUrl ?? ''),
      heroTitle: String(d.heroTitle ?? DEFAULT_STORE_SETTINGS.heroTitle),
      heroSubtitle: String(d.heroSubtitle ?? DEFAULT_STORE_SETTINGS.heroSubtitle),
      heroImageUrl: String(d.heroImageUrl ?? DEFAULT_STORE_SETTINGS.heroImageUrl),
      aboutTitle: String(d.aboutTitle ?? DEFAULT_STORE_SETTINGS.aboutTitle),
      aboutText: String(d.aboutText ?? DEFAULT_STORE_SETTINGS.aboutText),
      aboutImageUrl: String(d.aboutImageUrl ?? DEFAULT_STORE_SETTINGS.aboutImageUrl),
      whatsappNumber: String(d.whatsappNumber ?? ''),
      phone: String(d.phone ?? ''),
      address: String(d.address ?? DEFAULT_STORE_SETTINGS.address),
      openingHours: String(d.openingHours ?? ''),
      instagramUrl: String(d.instagramUrl ?? DEFAULT_STORE_SETTINGS.instagramUrl),
      otherSocialUrl: String(d.otherSocialUrl ?? ''),
      hideDemoExamples: Boolean(d.hideDemoExamples),
      updatedAt: tsToIso(d.updatedAt),
      updatedBy: String(d.updatedBy ?? ''),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/store');
  }
}

export async function saveStoreSettings(
  input: Omit<StoreSettings, 'updatedAt' | 'updatedBy'>,
  userUid: string
): Promise<void> {
  if (isUsingTestMode()) {
    await callTestStore({ action: 'save_settings', data: input });
    return;
  }

  const parsed = storeSettingsSchema.parse(input);
  try {
    await setDoc(doc(db, 'settings', 'store'), {
      ...parsed,
      hideDemoExamples: Boolean(parsed.hideDemoExamples),
      updatedAt: serverTimestamp(),
      updatedBy: userUid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/store');
  }
}

export async function markDemoExamplesHandled(
  currentSettings: StoreSettings,
  userUid: string
): Promise<void> {
  if (isUsingTestMode()) return;
  if (currentSettings.hideDemoExamples) return;
  await saveStoreSettings(
    {
      storeName: currentSettings.storeName,
      logoUrl: currentSettings.logoUrl,
      heroTitle: currentSettings.heroTitle,
      heroSubtitle: currentSettings.heroSubtitle,
      heroImageUrl: currentSettings.heroImageUrl,
      aboutTitle: currentSettings.aboutTitle,
      aboutText: currentSettings.aboutText,
      aboutImageUrl: currentSettings.aboutImageUrl,
      whatsappNumber: currentSettings.whatsappNumber,
      phone: currentSettings.phone,
      address: currentSettings.address,
      openingHours: currentSettings.openingHours,
      instagramUrl: currentSettings.instagramUrl,
      otherSocialUrl: currentSettings.otherSocialUrl,
      hideDemoExamples: true,
    },
    userUid
  );
}

export async function seedDemoDresses(
  userUid: string,
  currentSettings: StoreSettings
): Promise<void> {
  if (isUsingTestMode()) {
    await callTestStore({ action: 'seed_demo' });
    return;
  }

  for (const item of DEMO_SAMPLE_DRESSES) {
    await createDress(
      {
        name: item.name,
        category: item.category,
        description: item.description,
        details: item.details,
        currentPrice: item.currentPrice,
        previousPrice: item.previousPrice,
        mainImageUrl: item.mainImageUrl,
        galleryImages: item.galleryImages,
        availability: item.availability,
        status: 'published',
        isDemo: true,
      },
      userUid,
      item.slug
    );
  }
  await markDemoExamplesHandled(currentSettings, userUid);
}
