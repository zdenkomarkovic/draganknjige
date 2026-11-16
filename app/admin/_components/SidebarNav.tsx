'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Counts {
  orders: number
  inquiries: number
}

const NAV = [
  ['/admin/', 'Pregled'],
  ['/admin/proizvodi/', 'Proizvodi'],
  ['/admin/kategorije/', 'Kategorije'],
  ['/admin/narudzbine/', 'Narudžbine'],
  ['/admin/upiti/', 'Poruke'],
  ['/admin/korisnici/', 'Korisnici'],
  ['/admin/nalog/', 'Moj nalog'],
] as const

/** Meni sa brojačima novog. Brojevi se osveže pri svakom prelasku na drugu stranicu i na 30 sekundi. */
export default function SidebarNav({ initial, isAdmin = false }: { initial: Counts; isAdmin?: boolean }) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<Counts>(initial)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/admin/counts', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((c: Counts | null) => alive && c && setCounts(c))
        .catch(() => {})
    load()
    const t = setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [pathname])

  const badge: Record<string, number> = {
    '/admin/narudzbine/': counts.orders,
    '/admin/upiti/': counts.inquiries,
  }

  return (
    <>
      {NAV.filter(([href]) => isAdmin || href !== '/admin/korisnici/').map(([href, label]) => {
        const n = badge[href] ?? 0
        return (
          <Link key={href} href={href} className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100">
            {label}
            {n > 0 && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold leading-5 text-white"
                title={`Novih: ${n}`}
              >
                {n > 99 ? '99+' : n}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}
