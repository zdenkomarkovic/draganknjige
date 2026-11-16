'use client'

import { useState } from 'react'

const inputCls =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand'

export default function ProductInquiryForm({ productId, productName }: { productId: string; productName: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setState('sending')
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/upit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...Object.fromEntries(f) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Greška pri slanju poruke')
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri slanju poruke')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 md:p-5 text-sm text-green-800">
        <p className="font-semibold font-serif">Hvala, poruka je poslata!</p>
        <p className="mt-1">Javićemo vam se na broj telefona koji ste uneli.</p>
      </div>
    )
  }

  return (
    <details className="group rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <summary className="cursor-pointer list-none font-semibold font-serif text-gray-900 flex items-center justify-between">
        Postavite pitanje za ovaj proizvod
        <span className="text-brand transition-transform group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <p className="text-sm text-gray-500">
          Proizvod: <span className="font-medium text-gray-800">{productName}</span>
        </p>
        <input name="ime" required minLength={2} maxLength={100} placeholder="Vaše ime *" className={inputCls} autoComplete="name" />
        <input
          name="telefon"
          type="tel"
          required
          maxLength={20}
          placeholder="Broj telefona * (da bismo vam odgovorili)"
          className={inputCls}
          autoComplete="tel"
        />
        <input name="email" type="email" maxLength={255} placeholder="Email (nije obavezan)" className={inputCls} autoComplete="email" />
        <textarea name="poruka" required minLength={5} maxLength={2000} rows={4} placeholder="Vaše pitanje *" className={inputCls} />
        {/* Honeypot: sakriveno od ljudi */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        {error && (
          <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 transition-colors"
        >
          {state === 'sending' ? 'Slanje…' : 'Pošalji poruku'}
        </button>
      </form>
    </details>
  )
}
