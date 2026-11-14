import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { StoreSettings } from '@/lib/types';
import { buildCatalogWhatsAppMessage, buildWhatsAppUrl } from '@/lib/validation';

interface EmptyCatalogStateProps {
  settings: StoreSettings;
  compact?: boolean;
}

export function EmptyCatalogState({ settings, compact = false }: EmptyCatalogStateProps) {
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildCatalogWhatsAppMessage(settings.storeName)
  );

  return (
    <div
      className={`bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg text-center mx-auto max-w-2xl ${
        compact ? 'px-6 py-10' : 'px-6 py-14 sm:py-16'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#8D8177] mb-3">
        Curadoria em atualização
      </p>
      <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#211D1D] text-balance">
        Nossa seleção de vestidos está sendo preparada
      </h3>
      <p className="mt-3 text-sm sm:text-base text-[#393333] leading-relaxed max-w-lg mx-auto">
        No momento, a boutique ainda não publicou peças nesta vitrine digital. Você pode visitar
        nosso espaço físico no Aterrado ou falar diretamente com a nossa equipe.
      </p>

      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>Atendimento pelo WhatsApp</span>
          </a>
        ) : (
          <Link
            href="/contato"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors whitespace-nowrap"
          >
            Ver endereço e contato
          </Link>
        )}
        <Link
          href="/sobre"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-[#211D1D]/30 text-[#211D1D] rounded-md hover:bg-[#F7F4EF] transition-colors whitespace-nowrap"
        >
          Conhecer a boutique
        </Link>
      </div>
    </div>
  );
}
