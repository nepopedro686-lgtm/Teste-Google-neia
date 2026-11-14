import firebaseConfig from '../firebase-applet-config.json';
import {
  DEFAULT_STORE_SETTINGS,
  DEMO_SAMPLE_DRESSES,
  Dress,
  DressAvailability,
  DressStatus,
  StoreSettings,
} from './types';
import { hasInitializedTestStore, readTestStore } from './test-store';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

function getStr(fields: Record<string, FirestoreValue>, key: string, fallback = ''): string {
  const v = fields[key];
  if (!v) return fallback;
  if (typeof v.stringValue === 'string') return v.stringValue;
  return fallback;
}

function getNum(fields: Record<string, FirestoreValue>, key: string): number | null {
  const v = fields[key];
  if (!v || v.nullValue !== undefined) return null;
  if (typeof v.doubleValue === 'number') return v.doubleValue;
  if (typeof v.integerValue === 'string') return Number(v.integerValue);
  return null;
}

function getBool(fields: Record<string, FirestoreValue>, key: string): boolean {
  return Boolean(fields[key]?.booleanValue);
}

function getTimestamp(fields: Record<string, FirestoreValue>, key: string): string | null {
  return fields[key]?.timestampValue ?? null;
}

function getStrArray(fields: Record<string, FirestoreValue>, key: string): string[] {
  const values = fields[key]?.arrayValue?.values;
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => item.stringValue)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function docIdFromName(name?: string): string {
  if (!name) return '';
  const parts = name.split('/');
  return parts[parts.length - 1] ?? '';
}

function parseDressDocument(doc: FirestoreDocument): Dress | null {
  if (!doc.fields) return null;
  const f = doc.fields;
  const id = docIdFromName(doc.name);
  const name = getStr(f, 'name');
  const slug = getStr(f, 'slug');
  if (!id || !name || !slug) return null;

  const availabilityRaw = getStr(f, 'availability', 'available');
  const availability: DressAvailability =
    availabilityRaw === 'last_units' || availabilityRaw === 'sold_out'
      ? availabilityRaw
      : 'available';

  const statusRaw = getStr(f, 'status', 'draft');
  const status: DressStatus =
    statusRaw === 'published' || statusRaw === 'archived' ? statusRaw : 'draft';

  return {
    id,
    name,
    slug,
    category: getStr(f, 'category'),
    description: getStr(f, 'description'),
    details: getStr(f, 'details'),
    currentPrice: getNum(f, 'currentPrice'),
    previousPrice: getNum(f, 'previousPrice'),
    mainImageUrl: getStr(f, 'mainImageUrl'),
    galleryImages: getStrArray(f, 'galleryImages'),
    availability,
    status,
    isDemo: getBool(f, 'isDemo'),
    createdAt: getTimestamp(f, 'createdAt'),
    updatedAt: getTimestamp(f, 'updatedAt'),
    createdBy: getStr(f, 'createdBy'),
  };
}

export async function fetchPublicStoreSettings(): Promise<StoreSettings> {
  if (await hasInitializedTestStore()) {
    const testStore = await readTestStore();
    return testStore.settings;
  }
  try {
    const res = await fetch(`${FIRESTORE_BASE}/settings/store?key=${firebaseConfig.apiKey}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return DEFAULT_STORE_SETTINGS;
    }
    const doc = (await res.json()) as FirestoreDocument;
    if (!doc.fields) {
      return DEFAULT_STORE_SETTINGS;
    }
    const f = doc.fields;
    return {
      storeName: getStr(f, 'storeName', DEFAULT_STORE_SETTINGS.storeName),
      logoUrl: getStr(f, 'logoUrl', DEFAULT_STORE_SETTINGS.logoUrl),
      heroTitle: getStr(f, 'heroTitle', DEFAULT_STORE_SETTINGS.heroTitle),
      heroSubtitle: getStr(f, 'heroSubtitle', DEFAULT_STORE_SETTINGS.heroSubtitle),
      heroImageUrl: getStr(f, 'heroImageUrl', DEFAULT_STORE_SETTINGS.heroImageUrl),
      aboutTitle: getStr(f, 'aboutTitle', DEFAULT_STORE_SETTINGS.aboutTitle),
      aboutText: getStr(f, 'aboutText', DEFAULT_STORE_SETTINGS.aboutText),
      aboutImageUrl: getStr(f, 'aboutImageUrl', DEFAULT_STORE_SETTINGS.aboutImageUrl),
      whatsappNumber: getStr(f, 'whatsappNumber', DEFAULT_STORE_SETTINGS.whatsappNumber),
      phone: getStr(f, 'phone', DEFAULT_STORE_SETTINGS.phone),
      address: getStr(f, 'address', DEFAULT_STORE_SETTINGS.address),
      openingHours: getStr(f, 'openingHours', DEFAULT_STORE_SETTINGS.openingHours),
      instagramUrl: getStr(f, 'instagramUrl', DEFAULT_STORE_SETTINGS.instagramUrl),
      otherSocialUrl: getStr(f, 'otherSocialUrl', DEFAULT_STORE_SETTINGS.otherSocialUrl),
      hideDemoExamples: getBool(f, 'hideDemoExamples'),
      updatedAt: getTimestamp(f, 'updatedAt'),
      updatedBy: getStr(f, 'updatedBy'),
    };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function fetchPublishedDresses(): Promise<Dress[]> {
  if (await hasInitializedTestStore()) {
    const testStore = await readTestStore();
    return testStore.dresses
      .filter((d) => d.status === 'published')
      .sort((a, b) => {
        const timeA = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const timeB = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return timeB - timeA;
      });
  }
  try {
    const [res, settings] = await Promise.all([
      fetch(`${FIRESTORE_BASE}:runQuery?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'dresses' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'EQUAL',
                value: { stringValue: 'published' },
              },
            },
          },
        }),
      }),
      fetchPublicStoreSettings(),
    ]);

    if (!res.ok) {
      return settings.hideDemoExamples ? [] : DEMO_SAMPLE_DRESSES;
    }

    const rows = (await res.json()) as Array<{ document?: FirestoreDocument }>;
    const dresses = rows
      .map((row) => (row.document ? parseDressDocument(row.document) : null))
      .filter((d): d is Dress => d !== null);

    if (dresses.length === 0 && !settings.hideDemoExamples) {
      return DEMO_SAMPLE_DRESSES;
    }

    return dresses.sort((a, b) => {
      const timeA = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const timeB = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return timeB - timeA;
    });
  } catch {
    return DEMO_SAMPLE_DRESSES;
  }
}

export async function fetchPublishedDressBySlug(slug: string): Promise<Dress | null> {
  if (await hasInitializedTestStore()) {
    const testStore = await readTestStore();
    return (
      testStore.dresses.find((d) => d.status === 'published' && d.slug === slug) ?? null
    );
  }
  try {
    const [res, settings] = await Promise.all([
      fetch(`${FIRESTORE_BASE}:runQuery?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'dresses' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: 'status' },
                      op: 'EQUAL',
                      value: { stringValue: 'published' },
                    },
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: 'slug' },
                      op: 'EQUAL',
                      value: { stringValue: slug },
                    },
                  },
                ],
              },
            },
            limit: 1,
          },
        }),
      }),
      fetchPublicStoreSettings(),
    ]);

    if (res.ok) {
      const rows = (await res.json()) as Array<{ document?: FirestoreDocument }>;
      const doc = rows[0]?.document;
      if (doc) return parseDressDocument(doc);
    }

    if (!settings.hideDemoExamples) {
      return DEMO_SAMPLE_DRESSES.find((d) => d.slug === slug) ?? null;
    }
    return null;
  } catch {
    return DEMO_SAMPLE_DRESSES.find((d) => d.slug === slug) ?? null;
  }
}

export async function fetchMediaAssetById(
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(mediaId)) {
    return null;
  }
  try {
    const res = await fetch(`${FIRESTORE_BASE}/media/${mediaId}?key=${firebaseConfig.apiKey}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const doc = (await res.json()) as FirestoreDocument;
    if (!doc.fields) return null;
    const base64 = getStr(doc.fields, 'dataBase64');
    const mimeType = getStr(doc.fields, 'mimeType', 'image/webp');
    if (!base64) return null;
    return {
      buffer: Buffer.from(base64, 'base64'),
      mimeType,
    };
  } catch {
    return null;
  }
}
