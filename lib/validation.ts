import { z } from 'zod';

export const dressSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Informe o nome do vestido (mínimo 2 caracteres).')
      .max(120, 'O nome do vestido pode ter no máximo 120 caracteres.'),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(140)
      .regex(/^[a-z0-9-]+$/, 'Slug inválido.'),
    category: z.string().trim().max(60, 'Categoria deve ter até 60 caracteres.').default(''),
    description: z.string().trim().max(2000, 'Descrição deve ter até 2000 caracteres.').default(''),
    details: z.string().trim().max(1500, 'Características devem ter até 1500 caracteres.').default(''),
    currentPrice: z
      .number()
      .min(0, 'O preço não pode ser negativo.')
      .max(1000000, 'Valor acima do limite permitido.')
      .nullable()
      .default(null),
    previousPrice: z
      .number()
      .min(0, 'O preço anterior não pode ser negativo.')
      .max(1000000, 'Valor acima do limite permitido.')
      .nullable()
      .default(null),
    mainImageUrl: z.string().trim().max(500).default(''),
    galleryImages: z.array(z.string().trim().max(500)).max(8, 'Máximo de 8 fotos na galeria.').default([]),
    availability: z.enum(['available', 'last_units', 'sold_out']),
    status: z.enum(['published', 'draft', 'archived']),
    isDemo: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'published' && !data.mainImageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mainImageUrl'],
        message: 'Adicione uma imagem principal antes de publicar o vestido.',
      });
    }
    if (
      data.previousPrice !== null &&
      data.currentPrice !== null &&
      data.previousPrice <= data.currentPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['previousPrice'],
        message: 'O preço anterior só deve ser informado quando for maior que o preço atual.',
      });
    }
  });

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Informe o nome da loja.').max(80),
  logoUrl: z.string().trim().max(500).default(''),
  heroTitle: z.string().trim().min(1, 'Informe o título principal.').max(140),
  heroSubtitle: z.string().trim().max(400).default(''),
  heroImageUrl: z.string().trim().max(500).default(''),
  aboutTitle: z.string().trim().min(1, 'Informe o título institucional.').max(120),
  aboutText: z.string().trim().max(4000).default(''),
  aboutImageUrl: z.string().trim().max(500).default(''),
  whatsappNumber: z.string().trim().max(20).default(''),
  phone: z.string().trim().max(30).default(''),
  address: z.string().trim().max(200).default(''),
  openingHours: z.string().trim().max(200).default(''),
  instagramUrl: z.string().trim().max(200).default(''),
  otherSocialUrl: z.string().trim().max(200).default(''),
  hideDemoExamples: z.boolean().optional(),
});

export function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return base || 'vestido';
}

export function formatBRL(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const cleaned = trimmed
    .replace(/[^\d.,]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function normalizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function buildWhatsAppUrl(rawNumber: string, message: string): string | null {
  const digits = normalizeWhatsAppDigits(rawNumber);
  if (digits.length < 10) return null;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}

export function buildDressWhatsAppMessage(
  dressName: string,
  currentPrice?: number | null
): string {
  const formattedPrice = formatBRL(currentPrice);
  if (formattedPrice) {
    return `Olá! Tenho interesse no vestido ${dressName} (${formattedPrice}). Poderia me passar mais informações?`;
  }
  return `Olá! Tenho interesse no vestido ${dressName}. Poderia me passar mais informações?`;
}

export function buildCatalogWhatsAppMessage(storeName = 'Neia Concept'): string {
  return `Olá! Visitei o catálogo da ${storeName} e gostaria de receber atendimento sobre os vestidos.`;
}

export function formatWhatsAppDisplay(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return rawNumber;
}
