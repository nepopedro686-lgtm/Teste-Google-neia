import React from 'react';
import { BoutiqueImage } from './BoutiqueImage';

interface BrandMarkProps {
  storeName?: string;
  logoUrl?: string;
  inverted?: boolean;
}

export function BrandMark({
  storeName = 'Neia Concept',
  logoUrl,
  inverted = false,
}: BrandMarkProps) {
  if (logoUrl) {
    return (
      <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
        <BoutiqueImage
          src={logoUrl}
          alt={storeName}
          width={140}
          height={40}
          className="h-9 w-auto max-w-[140px] object-contain"
          priority
        />
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-center leading-none whitespace-nowrap shrink-0 select-none">
      <span
        className={`font-serif text-[21px] sm:text-[23px] font-medium tracking-[0.26em] uppercase ${
          inverted ? 'text-[#F7F4EF]' : 'text-[#211D1D]'
        }`}
      >
        NÉIΛ
      </span>
      <span
        className={`mt-1 text-[9px] font-sans font-normal tracking-[0.42em] lowercase ${
          inverted ? 'text-[#D8CABC]' : 'text-[#8D8177]'
        }`}
      >
        concept
      </span>
    </span>
  );
}
