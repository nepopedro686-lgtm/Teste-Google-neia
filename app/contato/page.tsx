import React from 'react';
import type { Metadata } from 'next';
import { Clock, ExternalLink, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { fetchPublicStoreSettings } from '@/lib/firestore-public';
import {
  buildCatalogWhatsAppMessage,
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
} from '@/lib/validation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contato e Localização',
  description:
    'Entre em contato com a Neia Concept pelo WhatsApp ou visite nossa boutique no Aterrado, Volta Redonda - RJ.',
};

export default async function ContatoPage() {
  const settings = await fetchPublicStoreSettings();

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildCatalogWhatsAppMessage(settings.storeName)
  );

  const hasValidAddress = settings.address.trim().length > 8;
  const encodedAddress = encodeURIComponent(settings.address);
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const googleMapsEmbed = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
      <SiteHeader settings={settings} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <header className="mb-10 space-y-2 border-b border-[#D8CABC]/60 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177]">
            Atendimento personalizado
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#211D1D]">
            Contato e Localização
          </h1>
          <p className="text-sm sm:text-base text-[#393333] max-w-2xl">
            Fale diretamente com a equipe da {settings.storeName} ou visite a boutique em Volta
            Redonda.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-6 sm:p-8 space-y-6">
            {whatsappUrl && (
              <div className="space-y-2.5 pb-6 border-b border-[#D8CABC]/50">
                <h2 className="font-sans text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium">
                  Atendimento pelo WhatsApp
                </h2>
                <p className="text-sm text-[#393333]">
                  Tire dúvidas sobre vestidos disponíveis ou combine sua visita à loja.
                </p>
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
              </div>
            )}

            <div className="space-y-5 text-sm text-[#393333]">
              {hasValidAddress && (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Endereço</span>
                  </p>
                  <p className="text-[#211D1D] leading-relaxed">{settings.address}</p>
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#211D1D] underline underline-offset-4 decoration-[#D8CABC] hover:decoration-[#211D1D] pt-1"
                  >
                    <span>Abrir rota no Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}

              {settings.openingHours && (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Horário de funcionamento</span>
                  </p>
                  <p className="text-[#211D1D] whitespace-pre-line leading-relaxed">
                    {settings.openingHours}
                  </p>
                </div>
              )}

              {settings.phone && (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Telefone</span>
                  </p>
                  <a
                    href={`tel:${settings.phone.replace(/\D/g, '')}`}
                    className="text-[#211D1D] hover:underline"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}

              {(settings.instagramUrl || settings.otherSocialUrl) && (
                <div className="space-y-2.5 pt-2 border-t border-[#D8CABC]/50">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium">
                    Redes sociais
                  </p>
                  <div className="flex flex-col gap-2">
                    {settings.instagramUrl && (
                      <a
                        href={settings.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#211D1D] hover:text-[#393333]"
                      >
                        <Instagram className="w-4 h-4" aria-hidden="true" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {settings.otherSocialUrl && (
                      <a
                        href={settings.otherSocialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#211D1D] hover:text-[#393333]"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span>Link oficial</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Embed (only rendered when valid address exists) */}
          <div className="lg:col-span-7">
            {hasValidAddress ? (
              <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg overflow-hidden">
                <iframe
                  title={`Localização da boutique ${settings.storeName}`}
                  src={googleMapsEmbed}
                  className="w-full h-[360px] sm:h-[440px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-10 text-center text-sm text-[#393333]">
                Configure o endereço da boutique no painel administrativo para exibir o mapa.
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
