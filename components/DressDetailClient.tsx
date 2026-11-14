'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Expand,
  MessageCircle,
  Share2,
  X,
} from 'lucide-react';
import { AVAILABILITY_LABELS, Dress, StoreSettings } from '@/lib/types';
import {
  buildDressWhatsAppMessage,
  buildWhatsAppUrl,
  formatBRL,
} from '@/lib/validation';
import { BoutiqueImage } from './BoutiqueImage';

interface DressDetailClientProps {
  dress: Dress;
  settings: StoreSettings;
}

export function DressDetailClient({ dress, settings }: DressDetailClientProps) {
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (dress.mainImageUrl) list.push(dress.mainImageUrl);
    for (const img of dress.galleryImages || []) {
      if (img && !list.includes(img)) {
        list.push(img);
      }
    }
    return list;
  }, [dress.mainImageUrl, dress.galleryImages]);

  const [activeImage, setActiveImage] = useState(allImages[0] || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedPrice = formatBRL(dress.currentPrice);
  const formattedPrevious = formatBRL(dress.previousPrice);
  const showPromo =
    formattedPrice &&
    formattedPrevious &&
    dress.previousPrice !== null &&
    dress.currentPrice !== null &&
    dress.previousPrice > dress.currentPrice;

  const whatsappMessage = buildDressWhatsAppMessage(dress.name, dress.currentPrice);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMessage);

  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (!shareUrl) return;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${dress.name} | ${settings.storeName}`,
          text: dress.description || `Confira este vestido da ${settings.storeName}.`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share unsupported, fall back to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Ignore clipboard failure
      }
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] w-full bg-[#FFFFFF] border border-[#D8CABC]/60 rounded-lg overflow-hidden">
            <BoutiqueImage
              src={activeImage}
              alt={dress.name}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-top"
              priority
            />
            {activeImage && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#FFFFFF]/95 text-[#211D1D] border border-[#D8CABC] rounded-md shadow-sm hover:bg-[#FFFFFF] transition-colors"
                aria-label="Ampliar fotografia do vestido"
              >
                <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ampliar</span>
              </button>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {allImages.map((imgUrl, idx) => {
                const isSelected = imgUrl === activeImage;
                return (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative aspect-[3/4] rounded-md overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-[#211D1D] ring-1 ring-[#211D1D]'
                        : 'border-[#D8CABC]/70 opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`Ver imagem ${idx + 1} de ${dress.name}`}
                  >
                    <BoutiqueImage
                      src={imgUrl}
                      alt={`${dress.name} - foto ${idx + 1}`}
                      fill
                      sizes="140px"
                      className="object-cover object-top"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Product Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            {(dress.category || dress.isDemo) && (
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D8177]">
                {[dress.category, dress.isDemo ? 'Exemplo ilustrativo' : '']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#211D1D] leading-tight text-balance">
              {dress.name}
            </h1>
          </div>

          {/* Price */}
          <div className="pt-1 border-t border-[#D8CABC]/50">
            {formattedPrice ? (
              <div className="pt-4 flex items-baseline gap-3 tabular-nums">
                <span className="text-2xl font-medium text-[#211D1D]">
                  {formattedPrice}
                </span>
                {showPromo && (
                  <span className="text-sm text-[#8D8177] line-through">
                    {formattedPrevious}
                  </span>
                )}
              </div>
            ) : (
              <p className="pt-4 text-sm text-[#393333]/85">
                Valor disponível mediante consulta pelo WhatsApp.
              </p>
            )}
          </div>

          {/* Explicit Availability Indicator (Text + Icon, never hue-only) */}
          <div className="flex items-center gap-2 text-sm text-[#393333]">
            {dress.availability === 'available' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#211D1D] shrink-0" aria-hidden="true" />
                <span className="font-medium text-[#211D1D]">
                  {AVAILABILITY_LABELS.available} na boutique
                </span>
              </>
            )}
            {dress.availability === 'last_units' && (
              <>
                <Clock className="w-4 h-4 text-[#393333] shrink-0" aria-hidden="true" />
                <span className="font-medium text-[#211D1D]">
                  {AVAILABILITY_LABELS.last_units}
                </span>
              </>
            )}
            {dress.availability === 'sold_out' && (
              <>
                <AlertCircle className="w-4 h-4 text-[#8D8177] shrink-0" aria-hidden="true" />
                <span className="font-medium text-[#393333]">
                  {AVAILABILITY_LABELS.sold_out} no momento
                </span>
              </>
            )}
          </div>

          {/* Primary WhatsApp Action & Share */}
          <div className="space-y-3 pt-1">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>
                  {dress.availability === 'sold_out'
                    ? 'Consultar peças semelhantes no WhatsApp'
                    : 'Tenho interesse · Falar no WhatsApp'}
                </span>
              </a>
            ) : (
              <Link
                href="/contato"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors"
              >
                Ver contato e endereço da boutique
              </Link>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Link copiado para compartilhar</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>Compartilhar este vestido</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          {dress.description && (
            <div className="pt-5 border-t border-[#D8CABC]/50 space-y-2">
              <h2 className="font-sans text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium">
                Sobre a peça
              </h2>
              <p className="text-sm text-[#393333] leading-relaxed whitespace-pre-line">
                {dress.description}
              </p>
            </div>
          )}

          {/* Descriptive Characteristics / Details */}
          {dress.details && (
            <div className="pt-5 border-t border-[#D8CABC]/50 space-y-2">
              <h2 className="font-sans text-xs uppercase tracking-[0.16em] text-[#8D8177] font-medium">
                Detalhes
              </h2>
              <p className="text-sm text-[#393333] leading-relaxed whitespace-pre-line">
                {dress.details}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for High-Detail Viewing */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-[#211D1D]/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Visualização ampliada de ${dress.name}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-[#F7F4EF] text-[#211D1D] flex items-center justify-center hover:bg-[#D8CABC] transition-colors"
            aria-label="Fechar ampliação"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative w-full max-w-2xl aspect-[3/4] max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <BoutiqueImage
              src={activeImage}
              alt={dress.name}
              fill
              sizes="(max-width: 768px) 95vw, 672px"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
