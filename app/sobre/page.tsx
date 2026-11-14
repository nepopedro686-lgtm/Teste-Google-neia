import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { fetchPublicStoreSettings } from '@/lib/firestore-public';
import { buildCatalogWhatsAppMessage, buildWhatsAppUrl } from '@/lib/validation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { BoutiqueImage } from '@/components/BoutiqueImage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sobre a Boutique',
  description:
    'Conheça a história da Neia Concept, boutique dedicada exclusivamente a vestidos com 28 anos de atuação em Volta Redonda - RJ.',
};

export default async function SobrePage() {
  const settings = await fetchPublicStoreSettings();
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildCatalogWhatsAppMessage(settings.storeName)
  );

  return (
    <>
      <SiteHeader settings={settings} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Editorial Text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
                Nossa história · Volta Redonda
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#211D1D] leading-tight text-balance">
                {settings.aboutTitle}
              </h1>
            </div>

            <div className="h-[1px] w-16 bg-[#D8CABC]" aria-hidden="true" />

            <div className="text-base text-[#393333] leading-[1.75] space-y-4 whitespace-pre-line">
              {settings.aboutText}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors whitespace-nowrap"
              >
                <span>Explorar catálogo</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium border border-[#211D1D]/30 text-[#211D1D] rounded-md hover:bg-[#FFFFFF] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Conversar no WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Boutique Interior Photography */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-[#D8CABC]/70 bg-[#FFFFFF]">
              <BoutiqueImage
                src={settings.aboutImageUrl || '/images/neia-atelier-interior.jpg'}
                alt={`Boutique ${settings.storeName} em Volta Redonda`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
