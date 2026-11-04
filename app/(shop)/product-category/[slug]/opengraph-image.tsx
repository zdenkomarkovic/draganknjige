import { ImageResponse } from 'next/og'
import { getCategoryBySlug } from '@/lib/db/queries'
import { absoluteImageUrl } from '@/lib/images'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  const imageUrl = category?.image ? absoluteImageUrl(category.image.path, SITE_URL) : null

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Slika kategorije kao pozadina */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
        }}
      />

      {/* Tekst */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          color: '#fff',
          textAlign: 'center',
          padding: '0 80px',
        }}
      >
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }}>
          {SITE_NAME.toUpperCase()}
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.1 }}>
          {category?.name ?? 'Kategorija'}
        </div>
        {category?.description && (
          <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.75)', maxWidth: 700 }}>
            {category.description}
          </div>
        )}
      </div>
    </div>,
    { ...size },
  )
}
