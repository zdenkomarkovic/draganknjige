import { SITE_URL } from '@/lib/constants'
import { getSitemapProductCount, SITEMAP_CHUNK } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

// Indeks sitemap-ova (Google ga čita sa /sitemap.xml)
export async function GET() {
  const chunks = Math.max(1, Math.ceil((await getSitemapProductCount()) / SITEMAP_CHUNK))
  const urls = Array.from({ length: chunks + 1 }, (_, id) => `${SITE_URL}/sitemap/${id}.xml`)
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join('\n') +
    `\n</sitemapindex>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
