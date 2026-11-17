import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Samostalni build za Node.js hosting (cPanel): server.js + minimalni node_modules
  output: 'standalone',
  // Dashboard: upload više slika odjednom
  experimental: { serverActions: { bodySizeLimit: '60mb' } },
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Originalni sajt (WordPress) koristi trailing slash u svim URL-ovima; zadržavamo ga radi SEO-a
  trailingSlash: true,

  // 301 redirekti sa starih WordPress URL-ova koji više ne postoje
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/homepage-1', destination: '/', permanent: true },
      { source: '/my-account', destination: '/', permanent: true },
      { source: '/evercompare', destination: '/', permanent: true },
      { source: '/cart', destination: '/korpa/', permanent: true },
      { source: '/hvala', destination: '/checkout/uspeh/', permanent: true },
      { source: '/shop', destination: '/', permanent: true },
      { source: '/prirodni-cajevi', destination: '/biljni-cajevi/', permanent: true },
      {
        source: '/product-category/hladno-cedjena-ulja-2',
        destination: '/product-category/hladno-cedjena-ulja/',
        permanent: true,
      },
      { source: '/sitemap_index.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/:type(post|page|product|product_cat|category)-sitemap.xml', destination: '/sitemap.xml', permanent: true },
    ]
  },

  // Indeks sitemap-ova (sitemap.ts ima više delova, pa Next sam ne pravi /sitemap.xml)
  async rewrites() {
    return [{ source: '/sitemap.xml', destination: '/sitemap-index.xml' }]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
