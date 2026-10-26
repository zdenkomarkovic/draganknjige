import type { Metadata } from 'next'
import Script from 'next/script'
import { Merriweather, Open_Sans } from 'next/font/google'
import './globals.css'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { CartProvider } from '@/lib/cart/CartContext'
import { JsonLd } from '@/components/seo/JsonLd'

const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
})
const openSans = Open_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-open-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Organska eterična ulja, čajevi i kozmetika od hercegovačkog samoniklog bilja. Naručite online, plaćanje pouzećem, besplatna dostava preko 5.000 RSD.',
  icons: { icon: '/logo.webp' },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: SITE_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${merriweather.variable} ${openSans.variable}`}>
      <body className="font-sans">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-10886102026"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-10886102026');
          `}
        </Script>
        <CartProvider>{children}</CartProvider>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                logo: `${SITE_URL}/logo.webp`,
                telephone: '+381652036804',
                email: 'info@arijamare.com',
                sameAs: [
                  'https://www.facebook.com/arijamare1980/',
                  'https://www.instagram.com/arijamare',
                ],
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: SITE_NAME,
                inLanguage: 'sr-RS',
                publisher: { '@id': `${SITE_URL}/#organization` },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${SITE_URL}/prodavnica/?q={search_term_string}`,
                  'query-input': 'required name=search_term_string',
                },
              },
            ],
          }}
        />
      </body>
    </html>
  )
}
