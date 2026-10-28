import { sanityClient } from './client'
import type { Category, Product, Post } from '@/types/shop'

const categoryFields = `
  _id,
  name,
  "slug": slug.current,
  description,
  seoTitle,
  seoDescription,
  image { asset, alt },
  "parent": null
`

const categoryFieldsWithSubs = `
  ${categoryFields},
  "subcategories": *[_type == "subcategory" && category._ref == ^._id] | order(name asc) {
    _id,
    name,
    "slug": slug.current
  }
`

const productFields = `
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  price,
  salePrice,
  inStock,
  featured,
  "images": images[] { asset, alt },
  "category": category->{ name, "slug": slug.current },
  "subcategory": subcategory->{ name, "slug": slug.current }
`

const productFieldsFull = `
  ${productFields},
  description,
  summary,
  seoTitle,
  seoDescription,
  _updatedAt
`

export async function getAllCategories(): Promise<Category[]> {
  return sanityClient.fetch(
    `*[_type == "category"] | order(name asc) { ${categoryFieldsWithSubs} }`
  )
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const category = await sanityClient.fetch<Category | null>(
    `*[_type == "category" && slug.current == $slug][0] { ${categoryFieldsWithSubs} }`,
    { slug }
  )
  if (category) return category
  // Podkategorija se prikazuje na istoj ruti kao kategorija
  return sanityClient.fetch(
    `*[_type == "subcategory" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      "parent": category->{ _id, name, "slug": slug.current }
    }`,
    { slug }
  )
}

export async function getAllProducts(): Promise<Product[]> {
  return sanityClient.fetch(
    `*[_type == "product"] | order(_createdAt desc) { ${productFields} }`
  )
}

export async function searchProducts(q: string): Promise<Product[]> {
  return sanityClient.fetch(
    `*[_type == "product" && name match $q] | order(_createdAt desc) { ${productFields} }`,
    { q: `*${q}*` }
  )
}

export const PAGE_SIZE = 24

const SORT_ORDERS: Record<string, string> = {
  jeftinije: 'coalesce(salePrice, price) asc, _createdAt desc',
  skuplje: 'coalesce(salePrice, price) desc, _createdAt desc',
}

export async function getFilteredProducts(
  q?: string,
  categorySlug?: string,
  page = 1,
  sort?: string
): Promise<{ products: Product[]; total: number }> {
  const order = (sort && SORT_ORDERS[sort]) || '_createdAt desc'
  const conditions: string[] = ['_type == "product"']
  const params: Record<string, string> = {}
  const offset = (page - 1) * PAGE_SIZE

  if (q) {
    conditions.push('name match $q')
    params.q = `*${q}*`
  }
  if (categorySlug) {
    conditions.push(
      '(category->slug.current == $categorySlug || subcategory->slug.current == $categorySlug)'
    )
    params.categorySlug = categorySlug
  }

  const filter = `*[${conditions.join(' && ')}]`

  const [products, total] = await Promise.all([
    sanityClient.fetch<Product[]>(
      `${filter} | order(${order}) [${offset}...${offset + PAGE_SIZE}] { ${productFields} }`,
      params
    ),
    sanityClient.fetch<number>(`count(${filter})`, params),
  ])

  return { products, total }
}

export async function getFeaturedProducts(page = 1, pageSize = 8): Promise<{ products: Product[]; total: number }> {
  const offset = (page - 1) * pageSize
  const filter = `*[_type == "product" && featured == true]`
  const [products, total] = await Promise.all([
    sanityClient.fetch<Product[]>(
      `${filter} | order(_createdAt desc) [${offset}...${offset + pageSize}] { ${productFields} }`
    ),
    sanityClient.fetch<number>(`count(${filter})`),
  ])
  return { products, total }
}

export async function getProductsByCategory(
  categorySlug: string,
  page = 1,
  q?: string,
  sort?: string
): Promise<{ products: Product[]; total: number }> {
  return getFilteredProducts(q, categorySlug, page, sort)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return sanityClient.fetch(
    `*[_type == "product" && slug.current == $slug][0] { ${productFieldsFull} }`,
    { slug }
  )
}

export async function getRelatedProducts(categorySlug: string, excludeSlug: string): Promise<Product[]> {
  return sanityClient.fetch(
    `*[_type == "product" && (
      category->slug.current == $categorySlug ||
      subcategory->slug.current == $categorySlug
    ) && slug.current != $excludeSlug] | order(_createdAt desc) [0..3] { ${productFields} }`,
    { categorySlug, excludeSlug }
  )
}

// ---------- Blog ----------
export const POST_PAGE_SIZE = 9

const postCardFields = `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  categories[] { name, slug },
  mainImage { asset, alt }
`

export async function getPosts(page = 1, category?: string): Promise<{ posts: Post[]; total: number }> {
  const offset = (page - 1) * POST_PAGE_SIZE
  const filter = category ? `*[_type == "post" && $category in categories[].slug]` : `*[_type == "post"]`
  const params = category ? { category } : {}
  const [posts, total] = await Promise.all([
    sanityClient.fetch<Post[]>(
      `${filter} | order(publishedAt desc) [${offset}...${offset + POST_PAGE_SIZE}] { ${postCardFields} }`,
      params
    ),
    sanityClient.fetch<number>(`count(${filter})`, params),
  ])
  return { posts, total }
}

export async function getLatestPosts(limit = 3): Promise<Post[]> {
  return sanityClient.fetch(
    `*[_type == "post"] | order(publishedAt desc) [0...${limit}] { ${postCardFields} }`
  )
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] { ${postCardFields}, modifiedAt, body, seoTitle, seoDescription }`,
    { slug }
  )
}

export async function getBlogCategories(): Promise<{ name: string; slug: string }[]> {
  const all = await sanityClient.fetch<{ name: string; slug: string }[]>(`*[_type == "post"].categories[]{ name, slug }`)
  return [...new Map(all.filter(Boolean).map((c) => [c.slug, c])).values()]
}

export async function getLandingCategory(slug: string): Promise<Category | null> {
  return sanityClient.fetch(
    `*[_type == "category" && slug.current == $slug][0] { ${categoryFields}, body, pageSeoTitle, pageSeoDescription }`,
    { slug }
  )
}

// ---------- Sitemap ----------
export async function getSitemapData(): Promise<{
  products: { slug: string; updated: string }[]
  categories: { slug: string; updated: string; isMain: boolean }[]
  posts: { slug: string; updated: string }[]
}> {
  return sanityClient.fetch(`{
    "products": *[_type == "product" && defined(slug.current)] { "slug": slug.current, "updated": _updatedAt },
    "categories": *[_type in ["category", "subcategory"] && defined(slug.current)] { "slug": slug.current, "updated": _updatedAt, "isMain": _type == "category" },
    "posts": *[_type == "post" && defined(slug.current)] { "slug": slug.current, "updated": coalesce(modifiedAt, _updatedAt) }
  }`)
}
