'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadImagesAction } from '../actions'

/**
 * Dodavanje slika bez dodatnog potvrđivanja: klik otvara izbor fajlova, ili se slike prevuku na polje.
 * - Sa productId: slike se odmah šalju na server i stranica se osveži.
 * - Bez productId (novi proizvod): slike se čuvaju u formi i šalju se uz "Sačuvaj".
 */
export default function ImageDropzone({ productId }: { productId?: number }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [files, setFiles] = useState<File[]>([]) // samo za novi proizvod
  const [previews, setPreviews] = useState<string[]>([])

  function setLocal(list: File[]) {
    previews.forEach((u) => URL.revokeObjectURL(u))
    setFiles(list)
    setPreviews(list.map((f) => URL.createObjectURL(f)))
    if (inputRef.current) {
      const dt = new DataTransfer()
      list.forEach((f) => dt.items.add(f))
      inputRef.current.files = dt.files
    }
  }

  async function handle(picked: File[]) {
    const imgs = picked.filter((f) => f.type.startsWith('image/'))
    if (imgs.length === 0) {
      setMsg({ kind: 'error', text: 'Izaberi slike (JPG, PNG ili WebP).' })
      return
    }
    setMsg(null)
    if (!productId) {
      setLocal([...files, ...imgs].slice(0, 20))
      return
    }
    setBusy(true)
    const fd = new FormData()
    fd.set('id', String(productId))
    imgs.forEach((f) => fd.append('images', f))
    try {
      const r = await uploadImagesAction({}, fd)
      setMsg(r.error ? { kind: 'error', text: r.error } : { kind: 'ok', text: r.ok ?? 'Dodato.' })
      router.refresh()
    } catch {
      setMsg({ kind: 'error', text: 'Slanje slika nije uspelo. Pokušaj ponovo.' })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          handle(Array.from(e.dataTransfer.files))
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition-colors ${
          over ? 'border-brand bg-brand-soft' : 'border-gray-300 hover:border-brand hover:bg-gray-50'
        }`}
      >
        {busy ? (
          <span className="text-gray-600">Slanje slika…</span>
        ) : (
          <>
            <span className="font-semibold text-brand">Dodaj slike</span>
            <span className="text-gray-500"> — klikni ili prevuci slike ovde</span>
            <span className="block text-xs text-gray-400 mt-1">JPG, PNG ili WebP do 12 MB. Automatski se smanjuju na 800 px.</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          name={productId ? undefined : 'images'}
          accept="image/*"
          multiple
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            // Kod novog proizvoda se input posle ovoga popunjava iz state-a (setLocal), pa kopiramo pre toga
            const picked = Array.from(e.target.files ?? [])
            if (picked.length) handle(picked)
          }}
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
          {previews.map((src, i) => (
            <div key={src} className={`relative rounded-lg p-1 ${i === 0 ? 'border-2 border-green-600' : 'border border-gray-200'}`}>
              {i === 0 && (
                <span className="absolute left-1 top-1 z-10 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  ★ Glavna
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-24 w-full object-contain bg-gray-50 rounded" />
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => setLocal([files[i]!, ...files.filter((_, n) => n !== i)])}
                  className="mt-1 w-full rounded border border-gray-300 bg-white px-1 py-1 text-[11px] hover:bg-gray-50"
                >
                  Postavi kao glavnu
                </button>
              )}
              <button
                type="button"
                onClick={() => setLocal(files.filter((_, n) => n !== i))}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-gray-300 text-xs text-gray-600 hover:text-red-600 shadow"
                aria-label="Ukloni sliku"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <p
          role={msg.kind === 'error' ? 'alert' : 'status'}
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            msg.kind === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  )
}
