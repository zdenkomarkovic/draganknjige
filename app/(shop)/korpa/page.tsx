'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart/CartContext'
import CartItemRow from '@/components/cart/CartItem'

export default function KorpaPage() {
  const { items, totalPrice, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg mb-6">Korpa je prazna.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-brand text-white rounded text-sm hover:bg-brand-dark transition-colors"
        >
          Pregledaj proizvode
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Korpa</h1>
        <button
          onClick={clearCart}
          className="text-sm text-gray-400 hover:text-black underline underline-offset-2"
        >
          Isprazni korpu
        </button>
      </div>

      <div className="mb-8">
        {items.map((item) => (
          <CartItemRow key={item._id} item={item} />
        ))}
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Iznos porudzbine</span>
          <span>{totalPrice.toLocaleString('sr-RS')} RSD</span>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span>Ukupno</span>
          <span>{totalPrice.toLocaleString('sr-RS')} RSD</span>
        </div>
        <p className="text-xs text-gray-400">Plaćanje pouzećem.</p>
        <Link
          href="/checkout"
          className="block w-full py-3 bg-brand text-white rounded text-center font-medium hover:bg-brand-dark transition-colors"
        >
          Nastavi na placanje
        </Link>
        <Link
          href="/"
          className="block w-full py-3 border border-gray-300 rounded text-center text-sm hover:border-brand transition-colors"
        >
          Nastavi kupovinu
        </Link>
      </div>
    </main>
  )
}
