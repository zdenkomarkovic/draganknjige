'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { btnGhostCls, inputCls } from './ui'

interface Cat {
  id: number
  name: string
  subs: { id: number; name: string }[]
}

/** Filteri proizvoda koji se primenjuju automatski: izbor u listi odmah, a kucanje u pretrazi posle kratke pauze. */
export default function ProductFilters({ cats }: { cats: Cat[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function apply(key: string, value: string) {
    const p = new URLSearchParams(sp.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    p.delete('obrisano')
    const s = p.toString()
    router.replace(s ? `${pathname}?${s}` : pathname)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const active = ['q', 'cat', 'visible', 'status'].some((k) => sp.get(k))

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => apply('q', e.target.value.trim()), 400)
        }}
        placeholder="Naziv ili ID…"
        className={`${inputCls} col-span-2`}
      />
      <select value={sp.get('cat') ?? ''} onChange={(e) => apply('cat', e.target.value)} className={inputCls}>
        <option value="">Sve kategorije</option>
        {cats.map((c) => (
          <optgroup key={c.id} label={c.name}>
            <option value={`c:${c.id}`}>Cela kategorija: {c.name}</option>
            {c.subs.map((s) => (
              <option key={s.id} value={`s:${s.id}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <select value={sp.get('visible') ?? ''} onChange={(e) => apply('visible', e.target.value)} className={inputCls}>
        <option value="">Vidljivost: sve</option>
        <option value="1">Vidljivi</option>
        <option value="0">Sakriveni</option>
      </select>
      <select value={sp.get('status') ?? ''} onChange={(e) => apply('status', e.target.value)} className={inputCls}>
        <option value="">Uvoz: sve</option>
        <option value="link">Samo lista</option>
        <option value="details">Čeka slike</option>
        <option value="done">Kompletno</option>
      </select>
      {active && (
        <Link href={pathname} onClick={() => setQ('')} className={`${btnGhostCls} col-span-2 md:col-span-5 md:justify-self-start`}>
          ✕ Poništi filtere
        </Link>
      )}
    </div>
  )
}
