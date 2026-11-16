import 'server-only'
import { getPool, row, rows } from '@/lib/db'

export const ADMIN_PAGE_SIZE = 30

export const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)

// ─── Pregled ─────────────────────────────────────────────────────────────────

export async function getStats() {
  const [p, o, inq, imp] = await Promise.all([
    row<{ total: number; visible: number; hidden: number; no_image: number }>(
      `SELECT COUNT(*) AS total, SUM(visible = 1) AS visible, SUM(visible = 0) AS hidden,
         SUM(NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = products.id AND i.path <> '')) AS no_image
       FROM products`,
    ),
    row<{ nove: number; ukupno: number }>(`SELECT SUM(seen_at IS NULL) AS nove, COUNT(*) AS ukupno FROM orders`),
    row<{ nove: number }>(`SELECT COUNT(*) AS nove FROM inquiries WHERE seen_at IS NULL`),
    rows<{ import_status: string; n: number }>('SELECT import_status, COUNT(*) AS n FROM products GROUP BY import_status'),
  ])
  return { products: p, orders: o, inquiries: inq, imports: Object.fromEntries(imp.map((r) => [r.import_status, r.n])) }
}

// ─── Proizvodi ───────────────────────────────────────────────────────────────

export interface ProductFilters {
  q?: string
  categoryId?: number
  subcategoryId?: number
  visible?: '0' | '1'
  status?: string
  page?: number
}

export async function listProducts(f: ProductFilters) {
  const where: string[] = ['1=1']
  const params: unknown[] = []
  if (f.q?.trim()) {
    const q = f.q.trim()
    if (/^\d+$/.test(q)) {
      where.push('(p.id = ? OR p.kp_id = ?)')
      params.push(Number(q), Number(q))
    } else {
      where.push('p.name LIKE ?')
      params.push(`%${q.replace(/[%_\\]/g, '\\$&')}%`)
    }
  }
  if (f.subcategoryId) {
    where.push('p.subcategory_id = ?')
    params.push(f.subcategoryId)
  } else if (f.categoryId) {
    where.push('p.category_id = ?')
    params.push(f.categoryId)
  }
  if (f.visible === '0' || f.visible === '1') {
    where.push('p.visible = ?')
    params.push(Number(f.visible))
  }
  if (f.status && ['link', 'details', 'images', 'done'].includes(f.status)) {
    where.push('p.import_status = ?')
    params.push(f.status)
  }
  const w = where.join(' AND ')
  const page = Math.max(1, f.page ?? 1)
  const [list, count] = await Promise.all([
    rows<{
      id: number
      name: string
      slug: string
      price: number | null
      sale_price: number | null
      visible: number
      in_stock: number
      import_status: string
      created_at: string
      cat: string | null
      sub: string | null
      thumb: string | null
    }>(
      `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.visible, p.in_stock, p.import_status, p.created_at,
         c.name AS cat, s.name AS sub,
         (SELECT COALESCE(i.thumb_path, i.path) FROM product_images i WHERE i.product_id = p.id AND i.path <> '' ORDER BY i.position LIMIT 1) AS thumb
       FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN subcategories s ON s.id = p.subcategory_id
       WHERE ${w} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [...params, ADMIN_PAGE_SIZE, (page - 1) * ADMIN_PAGE_SIZE],
    ),
    row<{ n: number }>(`SELECT COUNT(*) AS n FROM products p WHERE ${w}`, params),
  ])
  return { list, total: count?.n ?? 0, page }
}

export interface ProductRecord {
  id: number
  kp_id: number | null
  source_url: string | null
  name: string
  slug: string
  category_id: number | null
  subcategory_id: number | null
  price: number | null
  sale_price: number | null
  short_description: string | null
  description: string | null
  summary: string | null
  condition: string | null
  in_stock: number
  visible: number
  featured: number
  seo_title: string | null
  seo_description: string | null
  import_status: string
}

export async function getProduct(id: number) {
  const p = await row<ProductRecord>(
    `SELECT id, kp_id, source_url, name, slug, category_id, subcategory_id, price, sale_price, short_description, description,
       summary, \`condition\`, in_stock, visible, featured, seo_title, seo_description, import_status FROM products WHERE id = ?`,
    [id],
  )
  if (!p) return null
  const images = await rows<{ id: number; position: number; path: string; thumb_path: string | null }>(
    "SELECT id, position, path, thumb_path FROM product_images WHERE product_id = ? AND path <> '' ORDER BY position",
    [id],
  )
  return { product: p, images }
}

export interface ProductInput {
  name: string
  categoryId: number | null
  subcategoryId: number | null
  price: number | null
  salePrice: number | null
  shortDescription: string | null
  description: string | null
  summary: string | null
  condition: string | null
  inStock: boolean
  visible: boolean
  featured: boolean
  seoTitle: string | null
  seoDescription: string | null
}

async function uniqueProductSlug(base: string, excludeId?: number) {
  let slug = base || 'proizvod'
  for (let n = 2; ; n++) {
    const taken = await row<{ id: number }>('SELECT id FROM products WHERE slug = ? AND id <> ?', [slug, excludeId ?? 0])
    if (!taken) return slug
    slug = `${base}-${n}`
  }
}

export async function saveProduct(id: number | null, d: ProductInput): Promise<number> {
  // Slug se pravi automatski iz naziva samo pri dodavanju; kod izmene ostaje isti da se adrese ne menjaju
  const existing = id ? await row<{ slug: string }>('SELECT slug FROM products WHERE id = ?', [id]) : null
  const slug = existing?.slug ?? (await uniqueProductSlug(slugify(d.name), undefined))
  // Podkategorija mora da pripada izabranoj kategoriji
  let categoryId = d.categoryId
  if (d.subcategoryId) {
    const s = await row<{ category_id: number }>('SELECT category_id FROM subcategories WHERE id = ?', [d.subcategoryId])
    if (s) categoryId = s.category_id
  }
  const values = [
    d.name,
    slug,
    categoryId,
    d.subcategoryId,
    d.price,
    d.salePrice,
    d.shortDescription,
    d.description,
    d.summary,
    d.condition,
    d.inStock ? 1 : 0,
    d.visible ? 1 : 0,
    d.featured ? 1 : 0,
    d.seoTitle,
    d.seoDescription,
  ]
  if (id) {
    await getPool().query(
      `UPDATE products SET name=?, slug=?, category_id=?, subcategory_id=?, price=?, sale_price=?, short_description=?, description=?,
         summary=?, \`condition\`=?, in_stock=?, visible=?, featured=?, seo_title=?, seo_description=? WHERE id=?`,
      [...values, id],
    )
    return id
  }
  const [res] = await getPool().query(
    `INSERT INTO products (name, slug, category_id, subcategory_id, price, sale_price, short_description, description, summary,
       \`condition\`, in_stock, visible, featured, seo_title, seo_description, import_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'done')`,
    values,
  )
  return (res as { insertId: number }).insertId
}

export async function setProductVisible(id: number, visible: boolean) {
  await getPool().query('UPDATE products SET visible = ? WHERE id = ?', [visible ? 1 : 0, id])
}

// ─── Kategorije ──────────────────────────────────────────────────────────────

export async function listCategoriesAdmin() {
  const [cats, subs] = await Promise.all([
    rows<{ id: number; name: string; slug: string; visible: number; products: number }>(
      `SELECT c.id, c.name, c.slug, c.visible, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products
       FROM categories c ORDER BY c.name`,
    ),
    rows<{ id: number; category_id: number; name: string; slug: string; visible: number; products: number }>(
      `SELECT s.id, s.category_id, s.name, s.slug, s.visible, (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id) AS products
       FROM subcategories s ORDER BY s.name`,
    ),
  ])
  return cats.map((c) => ({ ...c, subs: subs.filter((s) => s.category_id === c.id) }))
}

export async function getCategoryAdmin(id: number) {
  return row<{
    id: number
    name: string
    slug: string
    description: string | null
    body: string | null
    seo_title: string | null
    seo_description: string | null
    page_seo_title: string | null
    page_seo_description: string | null
    visible: number
  }>(
    `SELECT id, name, slug, description, body, seo_title, seo_description, page_seo_title, page_seo_description, visible
     FROM categories WHERE id = ?`,
    [id],
  )
}

export async function getSubcategoryAdmin(id: number) {
  return row<{
    id: number
    category_id: number
    name: string
    slug: string
    seo_title: string | null
    seo_description: string | null
    visible: number
  }>('SELECT id, category_id, name, slug, seo_title, seo_description, visible FROM subcategories WHERE id = ?', [id])
}

/** Kategorija i podkategorija dele rutu, pa slug mora biti jedinstven u obe tabele. */
export async function slugTaken(slug: string, ignore?: { table: 'categories' | 'subcategories'; id: number }) {
  const [c, s] = await Promise.all([
    row<{ id: number }>('SELECT id FROM categories WHERE slug = ?', [slug]),
    row<{ id: number }>('SELECT id FROM subcategories WHERE slug = ?', [slug]),
  ])
  if (c && !(ignore?.table === 'categories' && ignore.id === c.id)) return true
  if (s && !(ignore?.table === 'subcategories' && ignore.id === s.id)) return true
  return false
}

// ─── Narudžbine ──────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  ['nova', 'Nova'],
  ['potvrdjena', 'Potvrđena'],
  ['poslata', 'Poslata'],
  ['zavrsena', 'Završena'],
  ['otkazana', 'Otkazana'],
] as const

export async function listOrders(status?: string, page = 1) {
  const where = status && ORDER_STATUSES.some(([v]) => v === status) ? 'WHERE status = ?' : ''
  const params = where ? [status] : []
  const [list, count] = await Promise.all([
    rows<{ id: number; status: string; ime: string; prezime: string; grad: string; total: number; created_at: string; items: number }>(
      `SELECT o.id, o.status, o.ime, o.prezime, o.grad, o.total, o.created_at,
         (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS items
       FROM orders o ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, ADMIN_PAGE_SIZE, (Math.max(1, page) - 1) * ADMIN_PAGE_SIZE],
    ),
    row<{ n: number }>(`SELECT COUNT(*) AS n FROM orders ${where}`, params),
  ])
  return { list, total: count?.n ?? 0 }
}

export async function getOrder(id: number) {
  const o = await row<Record<string, string | number | null>>('SELECT * FROM orders WHERE id = ?', [id])
  if (!o) return null
  const items = await rows<{ product_id: number | null; name: string; quantity: number; price: number }>(
    'SELECT product_id, name, quantity, price FROM order_items WHERE order_id = ?',
    [id],
  )
  return { order: o, items }
}

export async function setOrderStatus(id: number, status: string) {
  if (!ORDER_STATUSES.some(([v]) => v === status)) return
  await getPool().query('UPDATE orders SET status = ? WHERE id = ?', [status, id])
}

// ─── Upiti kupaca ────────────────────────────────────────────────────────────

export const INQUIRY_STATUSES = [
  ['nova', 'Nova'],
  ['odgovoreno', 'Odgovoreno'],
] as const

export interface InquiryRecord {
  id: number
  status: string
  product_id: number | null
  product_name: string
  product_slug: string | null
  ime: string
  telefon: string
  email: string | null
  poruka: string
  created_at: string
}

export async function listInquiries(status?: string, page = 1) {
  const where = status && INQUIRY_STATUSES.some(([v]) => v === status) ? 'WHERE status = ?' : ''
  const params = where ? [status] : []
  const [list, count] = await Promise.all([
    rows<InquiryRecord>(`SELECT * FROM inquiries ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [
      ...params,
      ADMIN_PAGE_SIZE,
      (Math.max(1, page) - 1) * ADMIN_PAGE_SIZE,
    ]),
    row<{ n: number }>(`SELECT COUNT(*) AS n FROM inquiries ${where}`, params),
  ])
  return { list, total: count?.n ?? 0 }
}

export async function getInquiry(id: number) {
  return row<InquiryRecord>('SELECT * FROM inquiries WHERE id = ?', [id])
}

export async function setInquiryStatus(id: number, status: string) {
  if (!INQUIRY_STATUSES.some(([v]) => v === status)) return
  await getPool().query('UPDATE inquiries SET status = ? WHERE id = ?', [status, id])
}

export async function deleteInquiry(id: number) {
  await getPool().query('DELETE FROM inquiries WHERE id = ?', [id])
}

/** Brojači za sidebar: narudžbine i poruke koje admin još nije otvorio. */
export async function getNewCounts() {
  const [o, q] = await Promise.all([
    row<{ n: number }>('SELECT COUNT(*) AS n FROM orders WHERE seen_at IS NULL'),
    row<{ n: number }>('SELECT COUNT(*) AS n FROM inquiries WHERE seen_at IS NULL'),
  ])
  return { orders: Number(o?.n ?? 0), inquiries: Number(q?.n ?? 0) }
}

export async function markOrderSeen(id: number) {
  await getPool().query('UPDATE orders SET seen_at = NOW() WHERE id = ? AND seen_at IS NULL', [id])
}

export async function markInquirySeen(id: number) {
  await getPool().query('UPDATE inquiries SET seen_at = NOW() WHERE id = ? AND seen_at IS NULL', [id])
}
