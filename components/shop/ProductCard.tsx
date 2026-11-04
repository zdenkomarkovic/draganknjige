'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart/CartContext'
import { imageUrl } from '@/lib/images'
import type { Product } from '@/types/shop'

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const image = product.images?.[0]
  const price = product.salePrice ?? product.price
  const hasPrice = price != null
  const canAddToCart = product.inStock && hasPrice

  return (
    <div className="group border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white hover:shadow-lg hover:border-brand/40 transition-all duration-300">
      <Link href={`/shop/${product.slug}`} className="block aspect-square relative bg-gray-50">
        {image ? (
          <Image
            src={imageUrl(image.thumbPath ?? image.path)}
            alt={image.alt ?? product.name}
            unoptimized
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
            Nema slike
          </div>
        )}
        {product.salePrice && (
          <span className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Akcija
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1 gap-2">
        {product.category && (
          <span className="text-[11px] text-brand uppercase tracking-wider font-semibold">
            {product.category.name}
          </span>
        )}
        <Link href={`/shop/${product.slug}`} className="font-medium text-sm leading-snug font-serif hover:text-brand transition-colors">
          {product.name}
        </Link>
        {product.shortDescription && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{product.shortDescription}</p>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            {hasPrice ? (
              <>
                <span className="font-semibold">{price!.toLocaleString('sr-RS')} RSD</span>
                {product.salePrice && product.price != null && (
                  <span className="text-sm text-gray-400 line-through">
                    {product.price.toLocaleString('sr-RS')} RSD
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">Cena na upit</span>
            )}
          </div>

          {canAddToCart && (
            <button
              onClick={() =>
                addItem({
                  _id: product._id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  salePrice: product.salePrice,
                  image: product.images?.[0],
                })
              }
              className="flex-shrink-0 text-xs px-2 py-1 border border-brand text-brand rounded hover:bg-brand hover:text-white transition-colors"
              aria-label={`Dodaj ${product.name} u korpu`}
            >
              + Korpa
            </button>
          )}
        </div>

        <Link
          href={`/shop/${product.slug}`}
          className="w-full text-sm py-2 text-center border border-brand text-brand rounded hover:bg-brand hover:text-white transition-colors"
        >
          Vidi proizvod
        </Link>
      </div>
    </div>
  )
}
