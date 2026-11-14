import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const appUrl = process.env.APP_URL || 'https://neiaconcept.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Neia Concept | Boutique de Vestidos em Volta Redonda',
    template: '%s | Neia Concept',
  },
  description:
    'Há 28 anos em Volta Redonda vestindo mulheres com estilo e verdade. Explore o catálogo digital de vestidos da Neia Concept e fale pelo WhatsApp.',
  openGraph: {
    title: 'Neia Concept | Boutique de Vestidos em Volta Redonda',
    description:
      'Há 28 anos em Volta Redonda vestindo mulheres com estilo e verdade. Explore nosso catálogo exclusivo de vestidos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Neia Concept',
    images: [
      {
        url: '/images/neia-hero-boutique.jpg',
        width: 1200,
        height: 900,
        alt: 'Neia Concept — Boutique de Vestidos em Volta Redonda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neia Concept | Boutique de Vestidos',
    description:
      'Há 28 anos em Volta Redonda vestindo mulheres com estilo e verdade.',
    images: ['/images/neia-hero-boutique.jpg'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F7F4EF] text-[#393333] font-sans antialiased flex flex-col"
      >
        {children}
      </body>
    </html>
  );
}
