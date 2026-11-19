'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { imageUrl } from '@/lib/images'
import type { ProductImage } from '@/types/shop'

interface Props {
  images: ProductImage[]
  productName: string
}

function ArrowButton({
  direction,
  onClick,
  className = '',
}: {
  direction: 'prev' | 'next'
  onClick: (e: React.MouseEvent) => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Prethodna slika' : 'Sljedeća slika'}
      className={`flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white text-black shadow transition-colors ${className}`}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  )
}

export default function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const total = images.length
  const hasMany = total > 1

  const prev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setActive((i) => (i - 1 + total) % total)
    },
    [total],
  )

  const next = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setActive((i) => (i + 1) % total)
    },
    [total],
  )

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + total) % total)
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % total)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox, total])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function onTouchEnd(e: React.TouchEvent, onSwipeLeft: () => void, onSwipeRight: () => void) {
    if (touchStartX.current === null) return
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    if (delta < 0) onSwipeLeft()
    else onSwipeRight()
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-sm">
        Nema slike
      </div>
    )
  }

  const activeImage = images[active]!

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Glavna slika */}
        <div
          className="aspect-square relative rounded-lg overflow-hidden bg-gray-50 cursor-zoom-in"
          onTouchStart={onTouchStart}
          onTouchEnd={(e) =>
            onTouchEnd(
              e,
              () => setActive((i) => (i + 1) % total),
              () => setActive((i) => (i - 1 + total) % total),
            )
          }
        >
          <button
            className="absolute inset-0 z-10 w-full h-full"
            onClick={() => setLightboxOpen(true)}
            aria-label="Prikaži sliku preko celog ekrana"
          />
          <Image
            src={imageUrl(activeImage.path)}
            alt={productName}
            fill
            unoptimized
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {hasMany && (
            <>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
                <ArrowButton direction="prev" onClick={(e) => { e.stopPropagation(); prev() }} />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                <ArrowButton direction="next" onClick={(e) => { e.stopPropagation(); next() }} />
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                      i === active ? 'bg-brand' : 'bg-black/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnailovi */}
        {hasMany && (
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                  i === active ? 'border-brand' : 'border-transparent'
                }`}
                aria-label={`Slika ${i + 1}`}
              >
                <Image
                  src={imageUrl(img.thumbPath ?? img.path)}
                  alt={`${productName} – slika ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchEnd={(e) =>
            onTouchEnd(
              e,
              () => setActive((i) => (i + 1) % total),
              () => setActive((i) => (i - 1 + total) % total),
            )
          }
        >
          {/* Zatvori */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-xl"
            aria-label="Zatvori"
          >
            ✕
          </button>

          {/* Slika */}
          <div
            className="relative w-full max-w-5xl mx-4"
            style={{ height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl(activeImage.path)}
              alt={productName}
              fill
              unoptimized
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Strelice u lightboxu */}
          {hasMany && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white text-2xl transition-colors"
                aria-label="Prethodna slika"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white text-2xl transition-colors"
                aria-label="Sljedeća slika"
              >
                ›
              </button>
            </>
          )}

          {/* Indikator i broj */}
          {hasMany && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <span className="text-white/60 text-xs">
                {active + 1} / {total}
              </span>
              <div className="flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActive(i) }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === active ? 'bg-white' : 'bg-white/35'
                    }`}
                    aria-label={`Slika ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
