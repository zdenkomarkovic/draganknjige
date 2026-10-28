'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'

interface Props {
  total: number
  pageSize?: number
}

export default function Pagination({ total, pageSize = 24 }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Prikazuje max 5 stranica oko trenutne
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={`min-w-[36px] px-3 py-2 text-sm border rounded-lg transition-colors ${
              p === currentPage
                ? 'bg-brand text-white border-black'
                : 'border-gray-200 hover:border-brand'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  )
}
