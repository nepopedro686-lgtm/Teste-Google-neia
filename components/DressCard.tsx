import React from 'react';
import Link from 'next/link';
import { AVAILABILITY_LABELS, Dress } from '@/lib/types';
import { formatBRL } from '@/lib/validation';
import { BoutiqueImage } from './BoutiqueImage';

interface DressCardProps {
  dress: Dress;
}

export function DressCard({ dress }: DressCardProps) {
  const formattedPrice = formatBRL(dress.currentPrice);
  const formattedPrevious = formatBRL(dress.previousPrice);
  const showPromo =
    formattedPrice &&
    formattedPrevious &&
    dress.previousPrice !== null &&
    dress.currentPrice !== null &&
    dress.previousPrice > dress.currentPrice;

  const metadataParts: string[] = [];
  if (dress.category) {
    metadataParts.push(dress.category);
  }
  if (dress.availability !== 'available') {
    metadataParts.push(AVAILABILITY_LABELS[dress.availability]);
  }
  if (dress.isDemo) {
    metadataParts.push('Demonstração');
  }

  return (
    <Link
      href={`/vestidos/${dress.slug}`}
      className="group block bg-[#FFFFFF] border border-[#D8CABC]/60 rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(33,29,29,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D1D]"
    >
      {/* Image leads with 3:4 portrait proportion */}
      <div className="relative aspect-[3/4] w-full bg-[#F7F4EF] overflow-hidden">
        <BoutiqueImage
          src={dress.mainImageUrl}
          alt={dress.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] ${
            dress.availability === 'sold_out' ? 'opacity-80' : ''
          }`}
        />
      </div>

      {/* Editorial Card Info */}
      <div className="p-4 sm:p-5 space-y-1.5">
        {metadataParts.length > 0 && (
          <p className="text-xs text-[#393333]/80 tracking-wide">
            {metadataParts.join(' · ')}
          </p>
        )}

        <h3 className="font-serif text-xl font-medium text-[#211D1D] leading-snug line-clamp-2">
          {dress.name}
        </h3>

        <div className="pt-1 flex items-baseline gap-2.5 tabular-nums">
          {formattedPrice ? (
            <>
              <span className="text-[15px] font-medium text-[#211D1D]">
                {formattedPrice}
              </span>
              {showPromo && (
                <span className="text-xs text-[#8D8177] line-through">
                  {formattedPrevious}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-[#393333]/75">
              Consultar valor no WhatsApp
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
