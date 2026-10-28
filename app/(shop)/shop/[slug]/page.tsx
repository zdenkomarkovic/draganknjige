import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getProductBySlug, getRelatedProducts } from '@/lib/sanity/queries'
import { buildMetadata } from '@/lib/metadata'
import { SITE_URL, SITE_NAME } from '@/lib/constants'
import { urlFor } from '@/lib/sanity/image'
import { JsonLd } from '@/components/seo/JsonLd'
import ProductGallery from '@/components/shop/ProductGallery'
import AddToCartButton from '@/components/shop/AddToCartButton'
import ShareButton from '@/components/shop/ShareButton'
import ProductGrid from '@/components/shop/ProductGrid'
import RichText from '@/components/content/RichText'
import OrderByPhone from '@/components/content/OrderByPhone'
import Breadcrumbs from '@/components/seo/Breadcrumbs'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const price = product.salePrice ?? product.price
  const fallback = price != null
    ? `${product.name} — ${price.toLocaleString('sr-RS')} RSD`
    : product.name

  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? fallback,
    url: `/shop/${slug}/`,
    image: product.images?.[0]?.asset
      ? urlFor(product.images[0]).width(1200).height(630).fit('crop').url()
      : undefined,
  })
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const related = product.category
    ? await getRelatedProducts(product.category.slug, slug)
    : []

  const displayPrice = product.salePrice ?? product.price
  const hasSummary = (product.summary?.length ?? 0) > 0
  const hasDescription = (product.description?.length ?? 0) > 0

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          ...(product.category
            ? [{ name: product.category.name, href: `/product-category/${product.category.slug}/` }]
            : []),
          { name: product.name },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <ProductGallery images={product.images ?? []} productName={product.name} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold font-serif leading-tight">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            {displayPrice != null ? (
              <>
                <span className="text-3xl font-bold text-brand-dark">
                  {displayPrice.toLocaleString('sr-RS')} RSD
                </span>
                {product.salePrice && product.price != null && (
                  <span className="text-lg text-gray-400 line-through">
                    {product.price.toLocaleString('sr-RS')} RSD
                  </span>
                )}
                {product.salePrice && (
                  <span className="text-sm bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-semibold">
                    Akcija
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500 italic">Cena na upit</span>
            )}
          </div>

          {/* Kratak tekst ispod cene */}
          {hasSummary ? (
            <div className="text-sm text-gray-700 [&_h4]:!mt-0 [&_h4]:!mb-2 [&_h4]:text-base [&_p]:!mb-3 [&_p:last-child]:!mb-0">
              <RichText value={product.summary} />
            </div>
          ) : (
            product.shortDescription && (
              <p className="text-sm text-gray-700 leading-relaxed">{product.shortDescription}</p>
            )
          )}

          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
              {product.inStock ? 'Na stanju' : 'Nije na stanju'}
            </span>
            <ShareButton title={product.name} url={`${SITE_URL}/shop/${slug}/`} />
          </div>

          <AddToCartButton product={product} />

          <OrderByPhone />

          {product.category && (
            <p className="text-sm text-gray-500">
              Kategorija:{' '}
              <Link href={`/product-category/${product.category.slug}/`} className="text-brand hover:underline">
                {product.category.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="pb-3 border-b border-gray-200 text-lg font-semibold font-serif">Opis</h2>
        <div className="pt-8 max-w-3xl">
          {hasDescription ? <RichText value={product.description} /> : <p className="text-gray-500">Opis proizvoda nije dostupan.</p>}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-gray-100">
          <h2 className="text-xl font-semibold mb-6 font-serif">Može vas zanimati</h2>
          <ProductGrid products={related} />
        </section>
      )}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          url: `${SITE_URL}/shop/${slug}/`,
          description: product.seoDescription ?? product.name,
          image: (product.images ?? []).map((img) => urlFor(img).width(1200).url()),
          ...(product.category ? { category: product.category.name } : {}),
          brand: { '@type': 'Brand', name: SITE_NAME },
          ...(displayPrice != null
            ? {
                offers: {
                  '@type': 'Offer',
                  url: `${SITE_URL}/shop/${slug}/`,
                  priceCurrency: 'RSD',
                  price: displayPrice,
                  availability: product.inStock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                  itemCondition: 'https://schema.org/NewCondition',
                },
              }
            : {}),
        }}
      />
    </main>
  )
}
