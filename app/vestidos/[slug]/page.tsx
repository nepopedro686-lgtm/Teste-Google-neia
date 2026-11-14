import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  fetchPublicStoreSettings,
  fetchPublishedDressBySlug,
  fetchPublishedDresses,
} from '@/lib/firestore-public';
import { formatBRL } from '@/lib/validation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { DressDetailClient } from '@/components/DressDetailClient';
import { DressCard } from '@/components/DressCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [dress, settings] = await Promise.all([
    fetchPublishedDressBySlug(slug),
    fetchPublicStoreSettings(),
  ]);

  if (!dress) {
    return {
      title: 'Vestido não encontrado',
    };
  }

  const priceText = formatBRL(dress.currentPrice);
  const description =
    dress.description?.slice(0, 155) ||
    `${dress.name}${priceText ? ` — ${priceText}` : ''}. Disponível na boutique ${settings.storeName} em Volta Redonda.`;

  return {
    title: dress.name,
    description,
    openGraph: {
      title: `${dress.name} | ${settings.storeName}`,
      description,
      type: 'website',
      images: dress.mainImageUrl
        ? [
            {
              url: dress.mainImageUrl,
              alt: dress.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dress.name} | ${settings.storeName}`,
      description,
      images: dress.mainImageUrl ? [dress.mainImageUrl] : undefined,
    },
  };
}

export default async function VestidoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dress, settings, allDresses] = await Promise.all([
    fetchPublishedDressBySlug(slug),
    fetchPublicStoreSettings(),
    fetchPublishedDresses(),
  ]);

  if (!dress) {
    notFound();
  }

  const relatedDresses = allDresses
    .filter((item) => item.id !== dress.id)
    .slice(0, 3);

  const availabilitySchemaUrl =
    dress.availability === 'sold_out'
      ? 'https://schema.org/OutOfStock'
      : dress.availability === 'last_units'
      ? 'https://schema.org/LimitedAvailability'
      : 'https://schema.org/InStock';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: dress.name,
    description: dress.description || undefined,
    image: [dress.mainImageUrl, ...(dress.galleryImages || [])].filter(Boolean),
    ...(dress.currentPrice !== null
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'BRL',
            price: dress.currentPrice,
            availability: availabilitySchemaUrl,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SiteHeader settings={settings} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-[#8D8177] mb-6 sm:mb-8"
          aria-label="Navegação estrutural"
        >
          <Link href="/" className="hover:text-[#211D1D] transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link href="/catalogo" className="hover:text-[#211D1D] transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[#211D1D] truncate max-w-[220px] sm:max-w-none">
            {dress.name}
          </span>
        </nav>

        <DressDetailClient dress={dress} settings={settings} />

        {/* Related Published Dresses */}
        {relatedDresses.length > 0 && (
          <section className="mt-16 sm:mt-20 pt-12 border-t border-[#D8CABC]/60">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#211D1D]">
                Outros vestidos da boutique
              </h2>
              <Link
                href="/catalogo"
                className="text-xs sm:text-sm font-medium text-[#211D1D] border-b border-[#211D1D]/40 pb-0.5 hover:border-[#211D1D] whitespace-nowrap"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {relatedDresses.map((item) => (
                <DressCard key={item.id} dress={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
