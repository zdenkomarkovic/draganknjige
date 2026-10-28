import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CategorySidebar from '@/components/layout/CategorySidebar'
import { getAllCategories } from '@/lib/sanity/queries'

// Sidebar se osvežava iz Sanity-ja najviše na minut
export const revalidate = 60

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await getAllCategories()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-6 flex flex-col lg:flex-row gap-6">
        <CategorySidebar categories={categories} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      <Footer />
    </div>
  )
}
