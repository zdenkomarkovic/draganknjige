import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getCategoryBySlug, getProductsByCategory, PAGE_SIZE } from '@/lib/sanity/queries'
import { buildMetadata } from '@/lib/metadata'
import { urlFor } from '@/lib/sanity/image'
import ProductGrid from '@/components/shop/ProductGrid'
import SubcategoryDropdown from '@/components/shop/SubcategoryDropdown'
import SortSelect from '@/components/shop/SortSelect'
import SearchInput from '@/components/shop/SearchInput'
import Pagination from '@/components/shop/Pagination'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  return buildMetadata({
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description,
    url: `/product-category/${slug}/`,
  })
}

export default async function KategorijaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { q, page, sort } = await searchParams
  const query = q?.trim() ?? ''
  const currentPage = Math.max(1, parseInt(page ?? '1'))

  const [category, { products, total }] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug, currentPage, query || undefined, sort),
  ])

  if (!category) notFound()

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-black transition-colors">Početna</Link>
        <span>/</span>
        <Link href="/product-category" className="hover:text-black transition-colors">Kategorije</Link>
        {category.parent && (
          <>
            <span>/</span>
            <Link href={`/product-category/${category.parent.slug}`} className="hover:text-black transition-colors">
              {category.parent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">{category.name}</span>
      </nav>

      {category.image && (
        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8 bg-gray-100">
          <Image
            src={urlFor(category.image).width(1200).height(400).fit('crop').url()}
            alt={category.image.alt ?? category.name}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-black/30 flex items-end p-6">
            <h1 className="text-3xl font-bold text-white">{category.name}</h1>
          </div>
        </div>
      )}

      {!category.image && (
        <h1 className="text-2xl font-semibold mb-4">{category.name}</h1>
      )}

      {category.description && (
        <p className="text-gray-500 mb-8 max-w-2xl">{category.description}</p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-gray-400">
            {total} {total === 1 ? 'proizvod' : 'proizvoda'}
          </p>
          {category.subcategories && category.subcategories.length > 0 && (
            <SubcategoryDropdown subcategories={category.subcategories} label={category.name} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Suspense>
            <SortSelect />
          </Suspense>
          <Suspense>
            <SearchInput placeholder="Pretraži u ovoj kategoriji..." />
          </Suspense>
        </div>
      </div>

      <ProductGrid
        products={products}
        emptyMessage={query ? `Nema rezultata za „${query}".` : 'Nema proizvoda u ovoj kategoriji.'}
      />

      <Suspense>
        <Pagination total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </main>
  )
}
