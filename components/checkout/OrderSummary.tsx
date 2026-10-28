'use client'

import { useCart } from '@/lib/cart/CartContext'
import CartItemRow from '@/components/cart/CartItem'

export default function OrderSummary() {
  const { items, totalPrice } = useCart()

  if (items.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="font-semibold mb-3">Pregled narudzbine</h2>
      {items.map((item) => (
        <CartItemRow key={item._id} item={item} />
      ))}
      <div className="flex justify-between items-center pt-4 text-sm text-gray-600">
        <span>Iznos porudzbine</span>
        <span>{totalPrice.toLocaleString('sr-RS')} RSD</span>
      </div>
      <div className="flex justify-between items-center pt-2 font-semibold">
        <span>Ukupno</span>
        <span>{totalPrice.toLocaleString('sr-RS')} RSD</span>
      </div>
    </div>
  )
}
