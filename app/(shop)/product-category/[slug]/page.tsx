import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getCategoryBySlug, getProductsByCategory, PAGE_SIZE } from '@/lib/db/queries'
import { buildMetadata } from '@/lib/metadata'
import { categoryDescription, categoryIntro } from '@/lib/seo'
import { imageUrl } from '@/lib/images'
import ProductGrid from '@/components/shop/ProductGrid'
import SubcategoryDropdown from '@/components/shop/SubcategoryDropdown'
import SortSelect from '@/components/shop/SortSelect'
import SearchInput from '@/components/shop/SearchInput'
import Pagination from '@/components/shop/Pagination'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { q, page, sort } = await searchParams
  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  const pageNum = Math.max(1, parseInt(page ?? '1') || 1)
  return buildMetadata({
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? categoryDescription(category.name),
    url: pageNum > 1 ? `/product-category/${slug}/?page=${pageNum}` : `/product-category/${slug}/`,
    noIndex: !!(q?.trim() || sort),
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
      <Breadcrumbs
        items={[
          { name: 'Kategorije', href: '/product-category/' },
          ...(category.parent
            ? [{ name: category.parent.name, href: `/product-category/${category.parent.slug}/` }]
            : []),
          { name: category.name },
        ]}
      />

      {category.image && (
        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8 bg-gray-100">
          <Image
            src={imageUrl(category.image.path)}
            alt={category.image.alt ?? category.name}
            unoptimized
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

      <p className="text-gray-500 mb-8 max-w-2xl">
        {category.description || categoryIntro(category.name, total)}
      </p>

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
