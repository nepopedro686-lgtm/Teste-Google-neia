import React from 'react';
import Link from 'next/link';
import { fetchPublicStoreSettings } from '@/lib/firestore-public';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export default async function NotFound() {
  const settings = await fetchPublicStoreSettings();

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-8 sm:p-12 max-w-lg text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">Página não encontrada</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#211D1D]">
            Este vestido ou página não está disponível
          </h1>
          <p className="text-sm text-[#393333] leading-relaxed">
            A peça pode ter sido removida do catálogo ou o endereço digitado está incorreto.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/catalogo"
              className="px-6 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors"
            >
              Ir para o catálogo
            </Link>
            <Link
              href="/"
              className="px-6 py-3 text-sm font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF] transition-colors"
            >
              Página inicial
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
