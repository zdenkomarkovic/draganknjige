'use client'

import Image from 'next/image'
import { useCart } from '@/lib/cart/CartContext'
import { urlFor } from '@/lib/sanity/image'
import type { CartItem as CartItemType } from '@/types/shop'

export default function CartItemRow({ item }: { item: CartItemType }) {
  const { removeItem } = useCart()
  const price = item.salePrice ?? item.price

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100">
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
        {item.image ? (
          <Image
            src={urlFor(item.image).width(80).height(80).fit('crop').url()}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
            Nema slike
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-sm text-gray-500 mt-1">
          {price != null ? `${price.toLocaleString('sr-RS')} RSD` : 'Cena na upit'}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => removeItem(item._id)}
          className="text-gray-300 hover:text-black text-sm"
          aria-label="Ukloni"
        >
          ✕
        </button>
        <p className="font-semibold text-sm">
          {price != null ? `${(price * item.quantity).toLocaleString('sr-RS')} RSD` : '—'}
        </p>
      </div>
    </div>
  )
}
