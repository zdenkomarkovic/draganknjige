import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Originalni sajt (WordPress) koristi trailing slash u svim URL-ovima; zadržavamo ga radi SEO-a
  trailingSlash: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },

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

  async headers() {
    return [
      {
        source: '/((?!studio).*)',
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
