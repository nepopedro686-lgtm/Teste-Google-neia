export type DressAvailability = 'available' | 'last_units' | 'sold_out';
export type DressStatus = 'published' | 'draft' | 'archived';

export const ADMIN_AUTH_EMAIL = 'admin@neiaconcept.com.br';

export interface Dress {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  details: string;
  currentPrice: number | null;
  previousPrice: number | null;
  mainImageUrl: string;
  galleryImages: string[];
  availability: DressAvailability;
  status: DressStatus;
  isDemo?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl: string;
  whatsappNumber: string;
  phone: string;
  address: string;
  openingHours: string;
  instagramUrl: string;
  otherSocialUrl: string;
  hideDemoExamples?: boolean;
  updatedAt?: string | null;
  updatedBy?: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Neia Concept',
  logoUrl: '',
  heroTitle: 'Vestidos escolhidos com olhar, elegância e verdade.',
  heroSubtitle:
    'Há 28 anos em Volta Redonda, uma curadoria dedicada exclusivamente a vestidos que atravessam ocasiões com presença e naturalidade.',
  heroImageUrl: '/images/neia-hero-boutique.jpg',
  aboutTitle: 'Há 28 anos vestindo mulheres com estilo e verdade',
  aboutText:
    'Com 28 anos de trajetória em Volta Redonda, a Neia Concept construiu sua identidade por meio de um atendimento próximo, olhar apurado e respeito ao estilo individual de cada mulher.\n\nDedicada exclusivamente a vestidos, a boutique reúne peças selecionadas com atenção ao caimento, à leveza e à atemporalidade — valorizando escolhas autênticas para o dia a dia e para celebrações especiais.',
  aboutImageUrl: '/images/neia-atelier-interior.jpg',
  whatsappNumber: '',
  phone: '',
  address: 'Rua Luiz Alves Pereira, 232, Aterrado, Volta Redonda - RJ, CEP 27313-140',
  openingHours: '',
  instagramUrl: 'https://www.instagram.com/neia_concept/',
  otherSocialUrl: '',
  hideDemoExamples: false,
};

export const DEMO_SAMPLE_DRESSES: Dress[] = [
  {
    id: 'demo-vestido-midi-seda',
    name: 'Vestido Midi Seda Champagne',
    slug: 'vestido-midi-seda-champagne',
    category: 'Midi',
    description:
      'Modelo ilustrativo em corte midi fluido com decote sutil e caimento leve, pensado para ocasiões diurnas ou celebrações.',
    details:
      'Peça ilustrativa de demonstração · Edite ou substitua pelas peças reais da boutique no painel administrativo.',
    currentPrice: null,
    previousPrice: null,
    mainImageUrl: '/images/demo-vestido-midi-seda.jpg',
    galleryImages: [],
    availability: 'available',
    status: 'published',
    isDemo: true,
  },
  {
    id: 'demo-vestido-longo-cetim',
    name: 'Vestido Longo Cetim Drapeado',
    slug: 'vestido-longo-cetim-drapeado',
    category: 'Festa',
    description:
      'Modelo ilustrativo em silhueta longa com mangas ajustadas, drapeado discreto na cintura e brilho acetinado atemporal.',
    details:
      'Peça ilustrativa de demonstração · Edite ou substitua pelas peças reais da boutique no painel administrativo.',
    currentPrice: null,
    previousPrice: null,
    mainImageUrl: '/images/demo-vestido-longo-espresso.jpg',
    galleryImages: [],
    availability: 'available',
    status: 'published',
    isDemo: true,
  },
  {
    id: 'demo-vestido-linho-areia',
    name: 'Vestido Linho Estruturado Areia',
    slug: 'vestido-linho-estruturado-areia',
    category: 'Casual',
    description:
      'Modelo ilustrativo de modelagem evasê em tecido estruturado, com decote clássico e elegância natural para o dia a dia.',
    details:
      'Peça ilustrativa de demonstração · Edite ou substitua pelas peças reais da boutique no painel administrativo.',
    currentPrice: null,
    previousPrice: null,
    mainImageUrl: '/images/demo-vestido-linho-areia.jpg',
    galleryImages: [],
    availability: 'last_units',
    status: 'published',
    isDemo: true,
  },
];

export const AVAILABILITY_LABELS: Record<DressAvailability, string> = {
  available: 'Disponível',
  last_units: 'Últimas unidades',
  sold_out: 'Esgotado',
};

export const STATUS_LABELS: Record<DressStatus, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  archived: 'Arquivado',
};
