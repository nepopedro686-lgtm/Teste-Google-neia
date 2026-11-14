'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

interface BoutiqueImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export function BoutiqueImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className = '',
  priority = false,
}: BoutiqueImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F7F4EF] border border-[#D8CABC]/60 text-[#8D8177] p-4 text-center ${
          fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
        }`}
        aria-label={alt}
      >
        <ImageOff className="w-6 h-6 mb-2 opacity-60" aria-hidden="true" />
        <span className="text-xs font-sans text-[#393333] max-w-[180px] truncate">{alt}</span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={className}
        referrerPolicy="no-referrer"
        priority={priority}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 1000}
      sizes={sizes}
      className={className}
      referrerPolicy="no-referrer"
      priority={priority}
      onError={() => setHasError(true)}
    />
  );
}
