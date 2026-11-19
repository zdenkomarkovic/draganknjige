import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductGrid from '@/components/shop/ProductGrid'
import Pagination from '@/components/shop/Pagination'
import SortSelect from '@/components/shop/SortSelect'
import SearchInput from '@/components/shop/SearchInput'
import { getFilteredProducts, PAGE_SIZE } from '@/lib/db/queries'
import { buildMetadata } from '@/lib/metadata'
import { SITE_NAME } from '@/lib/constants'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>
}): Promise<Metadata> {
  const { page, sort, q } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1') || 1)
  return buildMetadata({
    title: 'Knjige online',
    description:
      'Knjige, stripovi i kolekcionarski predmeti u raznim bojama. Naručite online na irex.rs, dostava poštom i plaćanje pouzećem.',
    url: pageNum > 1 ? `/?page=${pageNum}` : '/',
    // Rezultati pretrage i sortiranja nisu za indeks (duplirani sadržaj)
    noIndex: !!(q?.trim() || sort),
  })
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; q?: string }> }) {
  const { page, sort, q } = await searchParams
  const query = q?.trim().slice(0, 100) ?? ''
  const currentPage = Math.max(1, parseInt(page ?? '1') || 1)
  const { products, total } = await getFilteredProducts(query || undefined, undefined, currentPage, sort)

  return (
    <>
      {!query && (
      <section className="rounded-2xl bg-brand-soft px-5 py-4 md:py-5 text-center">
        <h1 className="font-serif font-bold text-gray-900 leading-tight break-words text-xl sm:text-2xl md:text-3xl">
          {SITE_NAME}
        </h1>
        <p className="mt-1.5 mx-auto max-w-2xl text-gray-700 italic text-sm">
          &bdquo;Nije stvar u tome koliko knjiga košta. Stvar je u tome koliko tebe košta da je ne pročitaš.&ldquo;
          <span className="not-italic text-gray-500"> &ndash; Džim Ron</span>
        </p>
        <h2 className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Kako naručiti</h2>
        <ol className="mt-1.5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-700">
          <li><b>1.</b> Izaberite knjigu</li>
          <li><b>2.</b> Dodajte u korpu ili pozovite</li>
          <li><b>3.</b> Šaljemo poštom, plaćate pouzećem</li>
        </ol>
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
