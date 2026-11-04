import Link from 'next/link'
import Image from 'next/image'
import { imageUrl } from '@/lib/images'
import type { Category } from '@/types/shop'

export default function CategoryList({
  categories,
  simple = false,
}: {
  categories: Category[]
  simple?: boolean
}) {
  if (categories.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">Nema kategorija.</p>
  }

  if (simple) {
    return (
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/product-category/${cat.slug}/`}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:border-brand hover:bg-gray-50 transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat._id}
          href={`/product-category/${cat.slug}/`}
          className="group relative block aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-800"
        >
          {cat.image && (
            <Image
              src={imageUrl(cat.image.path)}
              alt={cat.image.alt ?? cat.name}
              unoptimized
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4 text-white">
            <p className="font-serif font-semibold text-lg leading-tight">{cat.name}</p>
            <p className="text-xs text-white/80 mt-1 group-hover:text-white">Pogledaj proizvode &rarr;</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
