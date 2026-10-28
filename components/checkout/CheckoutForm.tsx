'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import type { OrderFormData } from '@/types/shop'

const initialForm: OrderFormData = {
  ime: '',
  prezime: '',
  email: '',
  telefon: '',
  adresa: '',
  grad: '',
  postanskiBroj: '',
  napomena: '',
}

export default function CheckoutForm() {
  const [form, setForm] = useState<OrderFormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/narudzbina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, items, totalPrice }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Greška pri slanju narudzbine')
      }

      try {
        sessionStorage.setItem(
          'purchase',
          JSON.stringify({
            value: totalPrice,
            transactionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          })
        )
      } catch {}

      clearCart()
      router.push('/checkout/uspeh')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri slanju narudzbine')
    } finally {
      setLoading(false)
    }
  }

  const field = (
    name: Exclude<keyof OrderFormData, 'marketingConsent'>,
    label: string,
    type = 'text',
    required = true
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name] ?? ''}
        onChange={handleChange}
        required={required}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('ime', 'Ime')}
        {field('prezime', 'Prezime')}
      </div>
      {field('email', 'Email', 'email')}
      {field('telefon', 'Telefon', 'tel')}
      {field('adresa', 'Adresa')}
      <div className="grid grid-cols-2 gap-4">
        {field('grad', 'Grad')}
        {field('postanskiBroj', 'Postanski broj')}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="napomena" className="text-sm font-medium">Napomena</label>
        <textarea
          id="napomena"
          name="napomena"
          value={form.napomena ?? ''}
          onChange={handleChange}
          rows={3}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={form.marketingConsent ?? false}
          onChange={(e) => setForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))}
          className="mt-1"
        />
        <span>Želim da primam novosti i ponude putem mejla (opciono).</span>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-500">
        Nacin placanja: <strong>Pouzecem pri dostavi</strong>
      </p>

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="w-full py-3 bg-brand text-white rounded font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Slanje...' : 'Posalji narudzbinu'}
      </button>
    </form>
  )
}
