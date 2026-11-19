import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getLandingCategory, getProductsByCategory } from '@/lib/db/queries'
import { categoryDescription, categoryIntro } from '@/lib/seo'
import { buildMetadata } from '@/lib/metadata'
import RichText from '@/components/content/RichText'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ProductGrid from '@/components/shop/ProductGrid'

// Na kategorijskim stranicama FAQ ide ispod kartica proizvoda: sadržaj se deli na uvod i FAQ
// (FAQ počinje prvim naslovom koji počinje sa „FAQ”).
function splitAtFaq(html = '') {
  const m = /<h[1-6][^>]*>\s*(?:<[^>]+>\s*)*FAQ/i.exec(html)
  return m ? { intro: html.slice(0, m.index), faq: html.slice(m.index) } : { intro: html, faq: '' }
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getLandingCategory(slug)
  if (!category) return {}
  return buildMetadata({
    title: category.pageSeoTitle ?? category.seoTitle ?? category.name,
    description:
      category.pageSeoDescription ?? category.seoDescription ?? category.description ?? categoryDescription(category.name),
    url: `/${slug}/`,
  })
}

// Svaka glavna kategorija iz baze ima svoju stranicu na /naziv-kategorije/ (podkategorije nemaju,
// one se prikazuju unutar nadkategorije). Statične stranice (o-nama, kontakt...) su u kodu.
export default async function CategoryLandingPage({ params }: Props) {
  const { slug } = await params
  const category = await getLandingCategory(slug)
  if (!category) notFound()

  const { products, total } = await getProductsByCategory(slug, 1)
  const { intro, faq } = splitAtFaq(category.body)

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumbs items={[{ name: category.name }]} />
      <h1 className="text-3xl font-semibold mb-8 font-serif">{category.name}</h1>
      <div className="max-w-4xl">
        {!intro.trim() && <p className="text-gray-700">{category.description || categoryIntro(category.name, total)}</p>}
        <RichText html={intro} />
      </div>
      <section className="mt-12">
        <ProductGrid products={products} emptyMessage="Nema proizvoda u ovoj kategoriji." />
        {total > products.length && (
          <p className="mt-6 text-center">
            <Link href={`/product-category/${slug}/`} className="text-brand underline underline-offset-4">
              Pogledaj sve proizvode ({total})
            </Link>
          </p>
        )}
      </section>
      {faq && (
        <section className="max-w-4xl mt-14 pt-10 border-t border-gray-100">
          <RichText html={faq} />
        </section>
      )}
    </main>
  )
}
