import { ImageResponse } from 'next/og'
import { getProductBySlug } from '@/lib/db/queries'
import { absoluteImageUrl } from '@/lib/images'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  const imageUrl = product?.images?.[0] ? absoluteImageUrl(product.images[0].thumbPath ?? product.images[0].path, SITE_URL) : null

  const displayPrice = product ? (product.salePrice ?? product.price) : null

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#0a0a0a',
        fontFamily: 'sans-serif',
        color: '#fff',
      }}
    >
      {/* Lijeva kolona — info */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 56px',
        }}
      >
        <div style={{ fontSize: 22, color: '#555', letterSpacing: '1px' }}>
          {SITE_NAME.toUpperCase()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {product?.category && (
            <div style={{ fontSize: 20, color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {product.category.name}
            </div>
          )}
          <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1px' }}>
            {product?.name ?? 'Proizvod'}
          </div>
          {displayPrice != null && (
            <div style={{ fontSize: 36, fontWeight: 600, color: '#e0e0e0' }}>
              {displayPrice.toLocaleString('sr-RS')} RSD
            </div>
          )}
        </div>

        <div style={{ fontSize: 18, color: '#444' }}>
          {product?.inStock ? '● Na stanju' : '○ Nije na stanju'}
        </div>
      </div>

      {/* Desna kolona — slika */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          width={630}
          height={630}
          style={{ objectFit: 'cover', flexShrink: 0 }}
        />
      )}

      {!imageUrl && (
        <div
          style={{
            width: 630,
            height: 630,
            flexShrink: 0,
            backgroundColor: '#111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            color: '#222',
          }}
        >
          ◻
        </div>
      )}
    </div>,
    { ...size },
  )
}
