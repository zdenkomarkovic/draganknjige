'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: '', label: 'Najnovije' },
  { value: 'jeftinije', label: 'Cena: od najjeftinijih' },
  { value: 'skuplje', label: 'Cena: od najskupljih' },
]

// Redosled proizvoda; izbor se čuva u URL-u (?sort=) i vraća na prvu stranicu
export default function SortSelect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) params.set('sort', e.target.value)
    else params.delete('sort')
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <select
      value={searchParams.get('sort') ?? ''}
      onChange={handleChange}
      aria-label="Redosled proizvoda"
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand transition-colors bg-white"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
