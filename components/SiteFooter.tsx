import React from 'react';
import Link from 'next/link';
import { Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { StoreSettings } from '@/lib/types';
import {
  buildCatalogWhatsAppMessage,
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
} from '@/lib/validation';
import { BrandMark } from './BrandMark';

interface SiteFooterProps {
  settings: StoreSettings;
}

export function SiteFooter({ settings }: SiteFooterProps) {
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildCatalogWhatsAppMessage(settings.storeName)
  );
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#211D1D] text-[#F7F4EF] border-t border-[#393333]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <BrandMark storeName={settings.storeName} logoUrl={settings.logoUrl} inverted />
            </Link>
            <p className="text-sm text-[#D8CABC] leading-relaxed max-w-sm">
              Boutique feminina dedicada exclusivamente a vestidos. Há 28 anos em Volta Redonda
              vestindo mulheres com estilo e verdade.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-3 space-y-3">
            <h2 className="font-sans text-xs uppercase tracking-[0.18em] text-[#D8CABC] font-medium">
              Navegação
            </h2>
            <ul className="space-y-2.5 text-sm text-[#F7F4EF]/90">
              <li>
                <Link href="/" className="hover:text-[#D8CABC] transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-[#D8CABC] transition-colors">
                  Catálogo de Vestidos
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-[#D8CABC] transition-colors">
                  Sobre a Boutique
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-[#D8CABC] transition-colors">
                  Contato e Localização
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location Column */}
          <div className="md:col-span-4 space-y-3">
            <h2 className="font-sans text-xs uppercase tracking-[0.18em] text-[#D8CABC] font-medium">
              Boutique & Atendimento
            </h2>
            <div className="space-y-2.5 text-sm text-[#F7F4EF]/90">
              {settings.address && (
                <p className="flex items-start gap-2.5 leading-relaxed">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#D8CABC]" aria-hidden="true" />
                  <span>{settings.address}</span>
                </p>
              )}
              {settings.openingHours && (
                <p className="text-xs text-[#D8CABC] pl-6 leading-relaxed">
                  {settings.openingHours}
                </p>
              )}
              {settings.phone && (
                <p className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 shrink-0 text-[#D8CABC]" aria-hidden="true" />
                  <a href={`tel:${settings.phone.replace(/\D/g, '')}`} className="hover:text-[#D8CABC]">
                    {settings.phone}
                  </a>
                </p>
              )}
              {whatsappUrl && (
                <p className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 shrink-0 text-[#D8CABC]" aria-hidden="true" />
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#D8CABC] underline underline-offset-4 decoration-[#D8CABC]/50"
                  >
                    WhatsApp {formatWhatsAppDisplay(settings.whatsappNumber)}
                  </a>
                </p>
              )}
              {settings.instagramUrl && (
                <p className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4 shrink-0 text-[#D8CABC]" aria-hidden="true" />
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#D8CABC]"
                  >
                    Instagram
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#393333] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#D8CABC]/80">
          <p>
            © {currentYear} {settings.storeName}. Todos os direitos reservados.
          </p>
          <Link
            href="/admin"
            className="hover:text-[#F7F4EF] transition-colors underline underline-offset-4 decoration-[#D8CABC]/30"
          >
            Área administrativa
          </Link>
        </div>
      </div>
    </footer>
  );
}
