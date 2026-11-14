import type { MetadataRoute } from 'next';
import { fetchPublishedDresses } from '@/lib/firestore-public';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_URL || 'https://neiaconcept.com.br').replace(/\/$/, '');
  const dresses = await fetchPublishedDresses();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/sobre`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contato`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const dressRoutes: MetadataRoute.Sitemap = dresses.map((dress) => ({
    url: `${baseUrl}/vestidos/${dress.slug}`,
    lastModified: dress.updatedAt ? new Date(dress.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...dressRoutes];
}
