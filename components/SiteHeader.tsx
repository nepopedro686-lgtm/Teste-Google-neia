'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MessageCircle, X } from 'lucide-react';
import { StoreSettings } from '@/lib/types';
import { buildCatalogWhatsAppMessage, buildWhatsAppUrl } from '@/lib/validation';
import { BrandMark } from './BrandMark';

interface SiteHeaderProps {
  settings: StoreSettings;
}

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
];

export function SiteHeader({ settings }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildCatalogWhatsAppMessage(settings.storeName)
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7F4EF]/95 backdrop-blur-sm border-b border-[#D8CABC]/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          href="/"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#211D1D] shrink-0"
          aria-label={`${settings.storeName} - Página inicial`}
        >
          <BrandMark storeName={settings.storeName} logoUrl={settings.logoUrl} />
        </Link>

        {/* Zone 2: Primary Text Navigation */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#393333]"
          aria-label="Navegação principal"
        >
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#211D1D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#211D1D] ${
                  isActive
                    ? 'text-[#211D1D] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#211D1D]'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D1D]"
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <Link
              href="/contato"
              className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-medium tracking-wide bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D1D]"
            >
              Visitar Boutique
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-[#211D1D] hover:bg-[#D8CABC]/30 transition-colors focus-visible:outline-2 focus-visible:outline-[#211D1D]"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F7F4EF] border-b border-[#D8CABC]">
          <nav
            className="max-w-6xl mx-auto px-4 py-3 flex flex-col divide-y divide-[#D8CABC]/50"
            aria-label="Menu mobile"
          >
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3.5 text-base font-medium flex items-center justify-between ${
                    isActive ? 'text-[#211D1D] font-semibold' : 'text-[#393333]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="text-xs text-[#8D8177] font-normal">Atual</span>
                  )}
                </Link>
              );
            })}
            {whatsappUrl && (
              <div className="pt-3 pb-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Conversar no WhatsApp</span>
                </a>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
