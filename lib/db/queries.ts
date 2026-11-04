import { getPool, row, rows } from './index'
import type { Category, Product, ProductImage } from '@/types/shop'

export const PAGE_SIZE = 24

// ─── Pomoćne ─────────────────────────────────────────────────────────────────

interface ProductRow {
  id: number
  name: string
  slug: string
  short_description: string | null
  description?: string | null
  summary?: string | null
  price: number | null
  sale_price: number | null
  in_stock: number
  featured: number
  condition: string | null
  seo_title?: string | null
  seo_description?: string | null
  updated_at?: string
  cat_name: string | null
  cat_slug: string | null
  sub_name: string | null
  sub_slug: string | null
}

const LIST_COLUMNS = `p.id, p.name, p.slug, p.short_description, p.price, p.sale_price, p.in_stock, p.featured, p.\`condition\`,
  c.name AS cat_name, c.slug AS cat_slug, s.name AS sub_name, s.slug AS sub_slug`

const FROM = `FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN subcategories s ON s.id = p.subcategory_id`

// Sakriven proizvod, kategorija ili podkategorija se ne prikazuje na sajtu
const VISIBLE = `p.visible = 1 AND COALESCE(c.visible, 1) = 1 AND COALESCE(s.visible, 1) = 1`

const nz = <T,>(v: T | null | undefined) => (v === null || v === undefined ? undefined : v)

function toProduct(r: ProductRow, images: ProductImage[]): Product {
  return {
    _id: String(r.id),
    name: r.name,
    slug: r.slug,
    shortDescription: nz(r.short_description),
    description: nz(r.description),
    summary: nz(r.summary),
    price: nz(r.price),
    salePrice: nz(r.sale_price),
    inStock: !!r.in_stock,
    featured: !!r.featured,
    condition: nz(r.condition),
    seoTitle: nz(r.seo_title),
    seoDescription: nz(r.seo_description),
    _updatedAt: r.updated_at,
    images,
    category: r.cat_slug ? { name: r.cat_name!, slug: r.cat_slug } : undefined,
    subcategory: r.sub_slug ? { name: r.sub_name!, slug: r.sub_slug } : undefined,
  }
}

async function loadImages(ids: number[], firstOnly: boolean): Promise<Map<number, ProductImage[]>> {
  const map = new Map<number, ProductImage[]>()
  if (ids.length === 0) return map
  const list = await rows<{
    product_id: number
    path: string
    thumb_path: string | null
    alt: string | null
    width: number | null
    height: number | null
  }>(
    `SELECT product_id, path, thumb_path, alt, width, height FROM product_images
     WHERE product_id IN (?) AND path <> '' ORDER BY product_id, position`,
    [ids],
  )
  for (const i of list) {
    const arr = map.get(i.product_id) ?? []
    if (firstOnly && arr.length > 0) continue
    arr.push({ path: i.path, thumbPath: i.thumb_path, alt: i.alt, width: i.width, height: i.height })
    map.set(i.product_id, arr)
  }
  return map
}

async function toProducts(list: ProductRow[], firstImageOnly = true): Promise<Product[]> {
  const images = await loadImages(
    list.map((r) => r.id),
    firstImageOnly,
  )
  return list.map((r) => toProduct(r, images.get(r.id) ?? []))
}

/** Pretraga po nazivu: FULLTEXT kad su sve reči dovoljno duge, inače LIKE */
function searchClause(q: string): { sql: string; params: unknown[] } {
  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .slice(0, 8)
  if (tokens.length === 0) return { sql: '1=1', params: [] }
  if (tokens.every((t) => t.length >= 3)) {
    return { sql: 'MATCH(p.name) AGAINST (? IN BOOLEAN MODE)', params: [tokens.map((t) => `+${t}*`).join(' ')] }
  }
  return { sql: 'p.name LIKE ?', params: [`%${tokens.join(' ').replace(/[%_\\]/g, '\\$&')}%`] }
}

// ─── Kategorije ──────────────────────────────────────────────────────────────

interface CategoryRow {
  id: number
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  image_path: string | null
  body?: string | null
  page_seo_title?: string | null
  page_seo_description?: string | null
}

function toCategory(r: CategoryRow): Category {
  return {
    _id: String(r.id),
    name: r.name,
    slug: r.slug,
    description: nz(r.description),
    seoTitle: nz(r.seo_title),
    seoDescription: nz(r.seo_description),
    image: r.image_path ? { path: r.image_path } : undefined,
    body: nz(r.body),
    pageSeoTitle: nz(r.page_seo_title),
    pageSeoDescription: nz(r.page_seo_description),
  }
}

const CATEGORY_COLUMNS = `id, name, slug, description, seo_title, seo_description, image_path`

export async function getAllCategories(): Promise<Category[]> {
  const [cats, subs] = await Promise.all([
    rows<CategoryRow>(`SELECT ${CATEGORY_COLUMNS} FROM categories WHERE visible = 1 ORDER BY name`),
    rows<{ id: number; category_id: number; name: string; slug: string }>(
      `SELECT id, category_id, name, slug FROM subcategories WHERE visible = 1 ORDER BY name`,
    ),
  ])
  return cats.map((c) => ({
    ...toCategory(c),
    subcategories: subs
      .filter((s) => s.category_id === c.id)
      .map((s) => ({ _id: String(s.id), name: s.name, slug: s.slug })),
  }))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cat = await row<CategoryRow>(`SELECT ${CATEGORY_COLUMNS} FROM categories WHERE slug = ? AND visible = 1`, [slug])
  if (cat) {
    const subs = await rows<{ id: number; name: string; slug: string }>(
      `SELECT id, name, slug FROM subcategories WHERE category_id = ? AND visible = 1 ORDER BY name`,
      [cat.id],
    )
    return { ...toCategory(cat), subcategories: subs.map((s) => ({ _id: String(s.id), name: s.name, slug: s.slug })) }
  }
  // Podkategorija se prikazuje na istoj ruti kao kategorija
  const sub = await row<{
    id: number
    name: string
    slug: string
    seo_title: string | null
    seo_description: string | null
    parent_id: number
    parent_name: string
    parent_slug: string
  }>(
    `SELECT s.id, s.name, s.slug, s.seo_title, s.seo_description, c.id AS parent_id, c.name AS parent_name, c.slug AS parent_slug
     FROM subcategories s JOIN categories c ON c.id = s.category_id
     WHERE s.slug = ? AND s.visible = 1 AND c.visible = 1`,
    [slug],
  )
  if (!sub) return null
  return {
    _id: String(sub.id),
    name: sub.name,
    slug: sub.slug,
    seoTitle: nz(sub.seo_title),
    seoDescription: nz(sub.seo_description),
    parent: { _id: String(sub.parent_id), name: sub.parent_name, slug: sub.parent_slug },
  }
}

export async function getLandingCategory(slug: string): Promise<Category | null> {
  const r = await row<CategoryRow>(
    `SELECT ${CATEGORY_COLUMNS}, body, page_seo_title, page_seo_description FROM categories WHERE slug = ? AND visible = 1`,
    [slug],
  )
  return r ? toCategory(r) : null
}

// ─── Proizvodi ───────────────────────────────────────────────────────────────

const SORT_ORDERS: Record<string, string> = {
  jeftinije: `COALESCE(p.sale_price, p.price) IS NULL, COALESCE(p.sale_price, p.price) ASC, p.created_at DESC`,
  skuplje: `COALESCE(p.sale_price, p.price) IS NULL, COALESCE(p.sale_price, p.price) DESC, p.created_at DESC`,
}

export async function getFilteredProducts(
  q?: string,
  categorySlug?: string,
  page = 1,
  sort?: string,
): Promise<{ products: Product[]; total: number }> {
  const where: string[] = [VISIBLE]
  const params: unknown[] = []

  if (categorySlug) {
    // Slug može biti kategorija ili podkategorija; filtriramo po ID-u da se koriste indeksi
    const target = await row<{ kind: 'c' | 's'; id: number }>(
      `SELECT 'c' AS kind, id FROM categories WHERE slug = ? UNION ALL SELECT 's', id FROM subcategories WHERE slug = ? LIMIT 1`,
      [categorySlug, categorySlug],
    )
    if (!target) return { products: [], total: 0 }
    where.push(target.kind === 'c' ? 'p.category_id = ?' : 'p.subcategory_id = ?')
    params.push(target.id)
  }
  if (q?.trim()) {
    const sc = searchClause(q)
    where.push(sc.sql)
    params.push(...sc.params)
  }

  const order = (sort && SORT_ORDERS[sort]) || 'p.created_at DESC, p.id DESC'
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE
  const whereSql = where.join(' AND ')

  const [list, count] = await Promise.all([
    rows<ProductRow>(`SELECT ${LIST_COLUMNS} ${FROM} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`, [
      ...params,
      PAGE_SIZE,
      offset,
    ]),
    row<{ n: number }>(`SELECT COUNT(*) AS n ${FROM} WHERE ${whereSql}`, params),
  ])
  return { products: await toProducts(list), total: count?.n ?? 0 }
}

export async function getFeaturedProducts(page = 1, pageSize = 8): Promise<{ products: Product[]; total: number }> {
  const where = `${VISIBLE} AND p.featured = 1`
  const [list, count] = await Promise.all([
    rows<ProductRow>(`SELECT ${LIST_COLUMNS} ${FROM} WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [
      pageSize,
      (Math.max(1, page) - 1) * pageSize,
    ]),
    row<{ n: number }>(`SELECT COUNT(*) AS n ${FROM} WHERE ${where}`),
  ])
  return { products: await toProducts(list), total: count?.n ?? 0 }
}

export async function getProductsByCategory(
  categorySlug: string,
  page = 1,
  q?: string,
  sort?: string,
): Promise<{ products: Product[]; total: number }> {
  return getFilteredProducts(q, categorySlug, page, sort)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const r = await row<ProductRow>(
    `SELECT ${LIST_COLUMNS}, p.description, p.summary, p.seo_title, p.seo_description, p.updated_at ${FROM}
     WHERE p.slug = ? AND ${VISIBLE}`,
    [slug],
  )
  if (!r) return null
  const images = await loadImages([r.id], false)
  return toProduct(r, images.get(r.id) ?? [])
}

/** Slični proizvodi: iz iste podkategorije (ili kategorije), bez trenutnog */
export async function getRelatedProducts(
  scope: { subcategorySlug?: string; categorySlug?: string },
  excludeSlug: string,
): Promise<Product[]> {
  const col = scope.subcategorySlug ? 's.slug' : 'c.slug'
  const slug = scope.subcategorySlug ?? scope.categorySlug
  if (!slug) return []
  const list = await rows<ProductRow>(
    `SELECT ${LIST_COLUMNS} ${FROM} WHERE ${VISIBLE} AND ${col} = ? AND p.slug <> ? ORDER BY p.created_at DESC LIMIT 4`,
    [slug, excludeSlug],
  )
  return toProducts(list)
}

// ─── Sitemap ─────────────────────────────────────────────────────────────────

export const SITEMAP_CHUNK = 5000

export async function getSitemapProductCount(): Promise<number> {
  return (await row<{ n: number }>(`SELECT COUNT(*) AS n ${FROM} WHERE ${VISIBLE}`))?.n ?? 0
}

export async function getSitemapProducts(chunk: number): Promise<{ slug: string; updated: string }[]> {
  return rows(
    `SELECT p.slug, p.updated_at AS updated ${FROM} WHERE ${VISIBLE} ORDER BY p.id LIMIT ? OFFSET ?`,
    [SITEMAP_CHUNK, chunk * SITEMAP_CHUNK],
  )
}

export async function getSitemapCategories(): Promise<{ slug: string; updated: string; isMain: boolean }[]> {
  const list = await rows<{ slug: string; updated: string; isMain: number }>(
    `SELECT slug, updated_at AS updated, 1 AS isMain FROM categories WHERE visible = 1
     UNION ALL SELECT s.slug, s.updated_at, 0 FROM subcategories s JOIN categories c ON c.id = s.category_id
     WHERE s.visible = 1 AND c.visible = 1`,
  )
  return list.map((c) => ({ ...c, isMain: !!c.isMain }))
}

// ─── Narudžbine ──────────────────────────────────────────────────────────────

export interface NewOrder {
  ime: string
  prezime: string
  email: string
  telefon: string
  adresa: string
  grad: string
  postanskiBroj: string
  napomena?: string
  marketingConsent?: boolean
  items: { productId: number | null; name: string; quantity: number; price: number }[]
  total: number
}

export async function createOrder(o: NewOrder): Promise<number> {
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const [res] = await conn.query(
      `INSERT INTO orders (status, ime, prezime, email, telefon, adresa, grad, postanski_broj, napomena, marketing_consent, subtotal, total)
       VALUES ('nova', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        o.ime,
        o.prezime,
        o.email,
        o.telefon,
        o.adresa,
        o.grad,
        o.postanskiBroj,
        o.napomena ?? '',
        o.marketingConsent ? 1 : 0,
        o.total,
        o.total,
      ],
    )
    const orderId = (res as { insertId: number }).insertId
    if (o.items.length) {
      await conn.query('INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES ?', [
        o.items.map((i) => [orderId, i.productId, i.name.slice(0, 255), i.quantity, i.price]),
      ])
    }
    await conn.commit()
    return orderId
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export async function getCustomerRows() {
  return rows<{
    email: string
    ime: string
    prezime: string
    telefon: string
    grad: string
    marketingConsent: number
    createdAt: string
    total: number
  }>(
    `SELECT email, ime, prezime, telefon, grad, marketing_consent AS marketingConsent, created_at AS createdAt, total
     FROM orders ORDER BY created_at DESC`,
  )
}
