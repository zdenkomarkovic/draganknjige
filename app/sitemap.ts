import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import {
  getSitemapCategories,
  getSitemapProductCount,
  getSitemapProducts,
  SITEMAP_CHUNK,
} from '@/lib/db/queries'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

// Sa desetinama hiljada proizvoda sitemap se deli na delove: /sitemap/0.xml (kategorije), /sitemap/1.xml, ...
// Spisak delova je u indeksu /sitemap.xml (app/sitemap.xml/route.ts).
export async function generateSitemaps() {
  const chunks = Math.max(1, Math.ceil((await getSitemapProductCount()) / SITEMAP_CHUNK))
  return Array.from({ length: chunks + 1 }, (_, id) => ({ id }))
}

const entry = (
  path: string,
  updated?: string,
  priority = 0.6,
  changeFrequency: 'daily' | 'weekly' | 'monthly' = 'monthly',
) => ({
  url: `${SITE_URL}${path}`,
  lastModified: updated ? new Date(updated.replace(' ', 'T') + 'Z') : undefined,
  changeFrequency,
  priority,
})

export default async function sitemap({ id }: { id: number | string }): Promise<MetadataRoute.Sitemap> {
  const n = Number(id)
  if (n === 0) {
    const categories = await getSitemapCategories()
    return [
      entry('/', undefined, 1, 'weekly'),
      entry('/kontakt/', undefined, 0.7),
      ...categories.filter((c) => c.isMain).map((c) => entry(`/${c.slug}/`, c.updated, 0.9, 'weekly')),
      ...categories.map((c) => entry(`/product-category/${c.slug}/`, c.updated, 0.8, 'weekly')),
    ]
  }
  const products = await getSitemapProducts(n - 1)
  return products.map((p) => entry(`/shop/${p.slug}/`, p.updated, 0.8, 'weekly'))
}
