'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { CartItem } from '@/types/shop'

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      // Svaki proizvod je jedinstven (1 komad), pa se stare količine svode na 1
      setItems((JSON.parse(saved) as CartItem[]).map((i) => ({ ...i, quantity: 1 })))
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem('cart', JSON.stringify(items))
  }, [items, mounted])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    // Proizvod se može dodati samo jednom
    setItems((prev) => (prev.some((i) => i._id === newItem._id) ? prev : [...prev, { ...newItem, quantity: 1 }]))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce(
    (sum, i) => sum + ((i.salePrice ?? i.price) ?? 0) * i.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart mora biti unutar CartProvider')
  return ctx
}
