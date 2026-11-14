import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import {
  fetchPublicStoreSettings,
  fetchPublishedDresses,
} from '@/lib/firestore-public';
import {
  buildCatalogWhatsAppMessage,
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
} from '@/lib/validation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { BoutiqueImage } from '@/components/BoutiqueImage';
import { DressCard } from '@/components/DressCard';
import { EmptyCatalogState } from '@/components/EmptyCatalogState';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, dresses] = await Promise.all([
    fetchPublicStoreSettings(),
    fetchPublishedDresses(),
  ]);

  const featuredDresses = dresses.slice(0, 6);
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildCatalogWhatsAppMessage(settings.storeName)
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: settings.storeName,
    description: settings.heroSubtitle,
    url: process.env.APP_URL || 'https://neiaconcept.com.br',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Luiz Alves Pereira, 232, Aterrado',
      addressLocality: 'Volta Redonda',
      addressRegion: 'RJ',
      postalCode: '27313-140',
      addressCountry: 'BR',
    },
    ...(settings.instagramUrl ? { sameAs: [settings.instagramUrl] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader settings={settings} />

      <main className="flex-1">
        {/* Section 1: Editorial Split Hero */}
        <section className="border-b border-[#D8CABC]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left Editorial Copy */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
                  Volta Redonda · 28 anos
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-medium text-[#211D1D] leading-[1.08] text-balance">
                  {settings.heroTitle}
                </h1>
                {settings.heroSubtitle && (
                  <p className="text-base sm:text-[17px] text-[#393333] leading-relaxed max-w-xl">
                    {settings.heroSubtitle}
                  </p>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors whitespace-nowrap"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium border border-[#211D1D]/35 text-[#211D1D] bg-transparent rounded-md hover:bg-[#FFFFFF] transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Conversar no WhatsApp</span>
                    </a>
                  ) : (
                    <Link
                      href="/contato"
                      className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium border border-[#211D1D]/35 text-[#211D1D] bg-transparent rounded-md hover:bg-[#FFFFFF] transition-colors whitespace-nowrap"
                    >
                      Contato e localização
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Impact Photography */}
              <div className="lg:col-span-6">
                <div className="relative aspect-[4/3] lg:h-full lg:min-h-[440px] w-full rounded-lg overflow-hidden border border-[#D8CABC]/70 bg-[#FFFFFF]">
                  <BoutiqueImage
                    src={settings.heroImageUrl || '/images/neia-hero-boutique.jpg'}
                    alt={`${settings.storeName} — Curadoria exclusiva de vestidos`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Featured Dresses Catalog */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
                Seleção da boutique
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#211D1D]">
                Vestidos em destaque
              </h2>
            </div>

            {dresses.length > 0 && (
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#211D1D] border-b border-[#211D1D]/40 pb-1 hover:border-[#211D1D] transition-colors self-start sm:self-auto whitespace-nowrap"
              >
                <span>Ver catálogo completo ({dresses.length})</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>

          {featuredDresses.length === 0 ? (
            <EmptyCatalogState settings={settings} compact />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredDresses.map((dress) => (
                <DressCard key={dress.id} dress={dress} />
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Boutique Story (28 Years) */}
        <section className="bg-[#FFFFFF] border-y border-[#D8CABC]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6">
                <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-[#D8CABC]/70 bg-[#F7F4EF]">
                  <BoutiqueImage
                    src={settings.aboutImageUrl || '/images/neia-atelier-interior.jpg'}
                    alt={`Espaço ${settings.storeName} em Volta Redonda`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
                  Nossa trajetória
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#211D1D] leading-tight text-balance">
                  {settings.aboutTitle}
                </h2>
                <p className="text-base text-[#393333] leading-relaxed whitespace-pre-line line-clamp-6">
                  {settings.aboutText}
                </p>
                <div className="pt-2">
                  <Link
                    href="/sobre"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#211D1D] border-b border-[#211D1D]/40 pb-1 hover:border-[#211D1D] transition-colors"
                  >
                    <span>Conhecer nossa história</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Location & Direct Contact */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
                  Atendimento presencial e digital
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#211D1D] text-balance">
                  Visite a boutique no Aterrado ou fale com a equipe
                </h2>

                <div className="space-y-3 pt-1 text-sm sm:text-base text-[#393333]">
                  {settings.address && (
                    <p className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-1 shrink-0 text-[#211D1D]" aria-hidden="true" />
                      <span>{settings.address}</span>
                    </p>
                  )}
                  {settings.openingHours && (
                    <p className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-1 shrink-0 text-[#211D1D]" aria-hidden="true" />
                      <span>{settings.openingHours}</span>
                    </p>
                  )}
                  {settings.phone && (
                    <p className="flex items-center gap-3">
                      <Phone className="w-4 h-4 shrink-0 text-[#211D1D]" aria-hidden="true" />
                      <span>{settings.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span>
                      WhatsApp {formatWhatsAppDisplay(settings.whatsappNumber)}
                    </span>
                  </a>
                )}

                <Link
                  href="/contato"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium border border-[#211D1D]/30 text-[#211D1D] rounded-md hover:bg-[#F7F4EF] transition-colors"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>Ver mapa e informações completas</span>
                </Link>

                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium text-[#393333] hover:text-[#211D1D] transition-colors"
                  >
                    <Instagram className="w-4 h-4" aria-hidden="true" />
                    <span>Acompanhar no Instagram</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
