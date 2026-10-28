import { getAllCategories } from '@/lib/sanity/queries'
import { buildMetadata } from '@/lib/metadata'
import CategoryList from '@/components/shop/CategoryList'

export const metadata = buildMetadata({
  title: 'Kategorije',
  description: 'Sve kategorije knjiga, stripova, ploča i kolekcionarskih predmeta.',
  url: '/product-category/',
})

export default async function KategorijeStrаnica() {
  const categories = await getAllCategories()

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-8">Kategorije</h1>
      <CategoryList categories={categories} />
    </main>
  )
}
