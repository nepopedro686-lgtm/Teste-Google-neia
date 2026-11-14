import React from 'react';
import type { Metadata } from 'next';
import {
  fetchPublicStoreSettings,
  fetchPublishedDresses,
} from '@/lib/firestore-public';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogClient } from '@/components/CatalogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catálogo de Vestidos',
  description:
    'Explore os vestidos disponíveis na boutique Neia Concept em Volta Redonda e fale diretamente pelo WhatsApp.',
};

export default async function CatalogoPage() {
  const [settings, dresses] = await Promise.all([
    fetchPublicStoreSettings(),
    fetchPublishedDresses(),
  ]);

  return (
    <>
      <SiteHeader settings={settings} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-8 sm:mb-10 space-y-2 border-b border-[#D8CABC]/60 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
            Curadoria exclusiva em vestidos
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#211D1D]">
            Catálogo
          </h1>
          <p className="text-sm sm:text-base text-[#393333] max-w-2xl">
            Selecione qualquer vestido para visualizar detalhes e iniciar atendimento personalizado
            pelo WhatsApp.
          </p>
        </header>

        <CatalogClient dresses={dresses} settings={settings} />
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
