'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Category } from '@/types/shop'

// Kategorije i podkategorije iz Sanity-ja. Na malim ekranima se sklapa u dugme "Kategorije".
export default function CategorySidebar({ categories }: { categories: Category[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Ručno otvorene/zatvorene kategorije; bez izbora se otvara ona u kojoj se nalazimo
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const toggle = (id: string, current: boolean) => setToggled((t) => ({ ...t, [id]: !current }))
  const isActive = (slug: string) => pathname.replace(/\/$/, '') === `/product-category/${slug}`

  return (
    <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-28 lg:self-start" aria-label="Kategorije">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden w-full flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 font-semibold"
      >
        Kategorije
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <nav className={`${open ? 'block' : 'hidden'} lg:block mt-2 lg:mt-0 rounded-lg border border-gray-200 bg-white`}>
        <h2 className="hidden lg:block px-4 pt-4 pb-2 font-semibold font-serif text-gray-900">Kategorije</h2>
        <ul className="py-2 max-h-[70vh] overflow-y-auto">
          {categories.map((c) => {
            const subs = c.subcategories ?? []
            const expanded = toggled[c._id] ?? (isActive(c.slug) || subs.some((s) => isActive(s.slug)))
            return (
              <li key={c._id}>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/product-category/${c.slug}/`}
                    onClick={() => setOpen(false)}
                    className={`flex-1 px-4 py-2 text-sm hover:text-brand ${isActive(c.slug) ? 'font-semibold text-brand' : ''}`}
                  >
                    {c.name}
                  </Link>
                  {subs.length > 0 && (
                    <button
                      type="button"
                      aria-label={`Podkategorije: ${c.name}`}
                      aria-expanded={expanded}
                      onClick={() => toggle(c._id, expanded)}
                      className="p-2 mr-2 hover:text-brand"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {subs.length > 0 && expanded && (
                  <ul className="pb-1 pl-4">
                    {subs.map((s) => (
                      <li key={s._id}>
                        <Link
                          href={`/product-category/${s.slug}/`}
                          onClick={() => setOpen(false)}
                          className={`block px-4 py-1.5 text-sm hover:text-brand ${isActive(s.slug) ? 'font-semibold text-brand' : 'text-gray-600'}`}
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
