import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductGrid from '@/components/shop/ProductGrid'
import Pagination from '@/components/shop/Pagination'
import SortSelect from '@/components/shop/SortSelect'
import { getFilteredProducts, PAGE_SIZE } from '@/lib/sanity/queries'
import { buildMetadata } from '@/lib/metadata'
import { SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = buildMetadata({
  title: 'Dragan knjige',
  description:
    'Knjige u raznim bojama. Naručite online, plaćanje pouzećem.',
  url: '/',
})

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string }> }) {
  const { page, sort } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1') || 1)
  const { products, total } = await getFilteredProducts(undefined, undefined, currentPage, sort)

  return (
    <>
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

      <section className="pt-8 pb-14">
        <div className="flex justify-end mb-4">
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>
        <ProductGrid products={products} emptyMessage="Nema proizvoda." />
        <Suspense>
          <Pagination total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </section>
    </>
  )
}
