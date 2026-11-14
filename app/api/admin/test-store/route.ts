import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  isTestAdminAuthenticated,
  readTestStore,
  writeTestStore,
} from '@/lib/test-store';
import { DEMO_SAMPLE_DRESSES, Dress, DressAvailability, DressStatus } from '@/lib/types';
import { dressSchema, slugify, storeSettingsSchema } from '@/lib/validation';

function unauthorized() {
  return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
}

export async function GET() {
  if (!(await isTestAdminAuthenticated())) {
    return unauthorized();
  }
  const store = await readTestStore();
  return NextResponse.json(store);
}

export async function POST(req: NextRequest) {
  if (!(await isTestAdminAuthenticated())) {
    return unauthorized();
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action;
    const store = await readTestStore();
    const now = new Date().toISOString();

    if (action === 'create_dress') {
      const id = `vestido-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const suffix = id.slice(-5);
      const rawData = (body.data || {}) as Record<string, unknown>;
      const nameStr = typeof rawData.name === 'string' ? rawData.name : '';
      const slug = `${slugify(nameStr)}-${suffix}`;

      const parsed = dressSchema.parse({
        ...rawData,
        slug,
      });

      const newDress: Dress = {
        id,
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
        createdAt: now,
        updatedAt: now,
        createdBy: 'test-admin',
      };

      store.dresses = [newDress, ...store.dresses];
      store.settings.hideDemoExamples = true;
      await writeTestStore(store);
      return NextResponse.json({ id, dress: newDress });
    }

    if (action === 'update_dress') {
      const id = typeof body.id === 'string' ? body.id : '';
      const idx = store.dresses.findIndex((d) => d.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Vestido não encontrado.' }, { status: 404 });
      }
      const existing = store.dresses[idx];
      const rawData = (body.data || {}) as Record<string, unknown>;
      const nameStr = typeof rawData.name === 'string' ? rawData.name : existing.name;
      const suffix = existing.slug.includes('-')
        ? existing.slug.split('-').pop() || id.slice(-5)
        : id.slice(-5);
      const nextSlug = `${slugify(nameStr)}-${suffix}`;

      const parsed = dressSchema.parse({
        ...rawData,
        slug: nextSlug,
      });

      const updated: Dress = {
        ...existing,
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
        updatedAt: now,
      };

      store.dresses[idx] = updated;
      await writeTestStore(store);
      return NextResponse.json({ dress: updated });
    }

    if (action === 'quick_update') {
      const id = typeof body.id === 'string' ? body.id : '';
      const idx = store.dresses.findIndex((d) => d.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Vestido não encontrado.' }, { status: 404 });
      }
      const patch = (body.patch || {}) as {
        availability?: DressAvailability;
        status?: DressStatus;
        currentPrice?: number | null;
      };

      const candidate: Dress = {
        ...store.dresses[idx],
        ...(patch.availability ? { availability: patch.availability } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.currentPrice !== undefined ? { currentPrice: patch.currentPrice } : {}),
        updatedAt: now,
      };

      dressSchema.parse(candidate);
      store.dresses[idx] = candidate;
      await writeTestStore(store);
      return NextResponse.json({ dress: candidate });
    }

    if (action === 'duplicate_dress') {
      const id = typeof body.id === 'string' ? body.id : '';
      const source = store.dresses.find((d) => d.id === id);
      if (!source) {
        return NextResponse.json({ error: 'Vestido não encontrado.' }, { status: 404 });
      }
      const newId = `vestido-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const copyName = `${source.name} (Cópia)`.slice(0, 120);
      const copySlug = `${slugify(copyName)}-${newId.slice(-5)}`;

      const copy: Dress = {
        ...source,
        id: newId,
        name: copyName,
        slug: copySlug,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      store.dresses = [copy, ...store.dresses];
      await writeTestStore(store);
      return NextResponse.json({ dress: copy });
    }

    if (action === 'delete_dress') {
      const id = typeof body.id === 'string' ? body.id : '';
      store.dresses = store.dresses.filter((d) => d.id !== id);
      store.settings.hideDemoExamples = true;
      await writeTestStore(store);
      return NextResponse.json({ ok: true });
    }

    if (action === 'seed_demo') {
      const demos = DEMO_SAMPLE_DRESSES.map((item) => ({
        ...item,
        id: `vestido-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        createdAt: now,
        updatedAt: now,
      }));
      store.dresses = [...demos, ...store.dresses];
      store.settings.hideDemoExamples = true;
      await writeTestStore(store);
      return NextResponse.json({ ok: true });
    }

    if (action === 'save_settings') {
      const rawSettings = (body.data || {}) as Record<string, unknown>;
      const parsed = storeSettingsSchema.parse(rawSettings);
      store.settings = {
        ...parsed,
        hideDemoExamples: Boolean(parsed.hideDemoExamples),
        updatedAt: now,
        updatedBy: 'test-admin',
      };
      await writeTestStore(store);
      return NextResponse.json({ settings: store.settings });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar operação.' },
      { status: 400 }
    );
  }
}
