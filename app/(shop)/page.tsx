import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductGrid from '@/components/shop/ProductGrid'
import Pagination from '@/components/shop/Pagination'
import SortSelect from '@/components/shop/SortSelect'
import SearchInput from '@/components/shop/SearchInput'
import { getFilteredProducts, PAGE_SIZE } from '@/lib/db/queries'
import { buildMetadata } from '@/lib/metadata'
import { SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = buildMetadata({
  title: 'Dragan knjige',
  description:
    'Knjige u raznim bojama. Naručite online, plaćanje pouzećem.',
  url: '/',
})

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; q?: string }> }) {
  const { page, sort, q } = await searchParams
  const query = q?.trim().slice(0, 100) ?? ''
  const currentPage = Math.max(1, parseInt(page ?? '1') || 1)
  const { products, total } = await getFilteredProducts(query || undefined, undefined, currentPage, sort)

  return (
    <>
      {!query && (
      <section className="rounded-2xl bg-brand-soft px-6 py-8 md:py-10 text-center">
        <h1 className="font-serif font-bold text-gray-900 leading-tight break-words text-2xl sm:text-3xl md:text-4xl">
          {SITE_NAME}
        </h1>
        <p className="mt-2 text-brand-dark font-semibold uppercase tracking-[0.2em] text-xs md:text-sm">
          Dragan knjige
        </p>
        <blockquote className="mt-4 mx-auto max-w-2xl text-gray-700 italic">
          &bdquo;Nije stvar u tome koliko knjiga košta. Stvar je u tome koliko tebe košta da je ne pročitaš.&ldquo;
          <footer className="mt-1 text-sm not-italic text-gray-500">&ndash; Džim Ron</footer>
        </blockquote>
      </section>
      )}

      <section className="pt-8 pb-14">
        <div className="flex items-center justify-between gap-3 mb-4">
          {query ? (
            <h1 className="font-serif text-xl font-semibold">
              Rezultati pretrage: „{query}“ <span className="text-gray-500 text-base font-normal">({total})</span>
            </h1>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Suspense>
              <SortSelect />
            </Suspense>
            <Suspense>
              <SearchInput placeholder="Pretraži sve proizvode..." />
            </Suspense>
          </div>
        </div>
        <ProductGrid products={products} emptyMessage={query ? `Nema rezultata za „${query}“.` : 'Nema proizvoda.'} />
        <Suspense>
          <Pagination total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </section>
    </>
  )
}
