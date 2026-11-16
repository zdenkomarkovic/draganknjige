'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { changePassword, login, logout, requireAdmin, requireUser } from '@/lib/admin/auth'
import { addUser, deleteUser, setUserPassword, setUserRole } from '@/lib/admin/users'
import {
  deleteInquiry,
  saveProduct,
  setInquiryStatus,
  setOrderStatus,
  setProductVisible,
  slugify,
  slugTaken,
  type ProductInput,
} from '@/lib/admin/data'
import { addProductImage, deleteAllProductImageFiles, deleteProductImage, setMainImage } from '@/lib/admin/images'
import { getPool, row } from '@/lib/db'

export interface FormState {
  error?: string
  ok?: string
}

// ─── Pomoćne ─────────────────────────────────────────────────────────────────

const text = (f: FormData, k: string) => {
  const v = f.get(k)
  return typeof v === 'string' ? v.trim() : ''
}
const textOrNull = (f: FormData, k: string) => text(f, k) || null
const intOrNull = (f: FormData, k: string) => {
  const v = text(f, k).replace(/[\s.]/g, '').replace(',', '.')
  if (!v) return null
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 0 ? n : NaN
}
const flag = (f: FormData, k: string) => f.get(k) === 'on'
const id = (v: FormDataEntryValue | number | null | undefined) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : 0
}

// ─── Prijava ─────────────────────────────────────────────────────────────────

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await login(text(formData, 'email'), String(formData.get('password') ?? ''))
  if (!result.ok) return { error: result.error }
  redirect('/admin/')
}

export async function logoutAction() {
  await logout()
  redirect('/admin/login/')
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const next = String(formData.get('next') ?? '')
  if (next !== String(formData.get('repeat') ?? '')) return { error: 'Nove lozinke se ne poklapaju.' }
  const r = await changePassword(user.id, String(formData.get('current') ?? ''), next)
  return r.ok ? { ok: 'Lozinka je promenjena.' } : { error: r.error }
}

// ─── Proizvodi ───────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(2, 'Naziv je obavezan.').max(255),
  price: z.number().int().nonnegative().nullable(),
  salePrice: z.number().int().nonnegative().nullable(),
})

export async function saveProductAction(_prev: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const productId = id(f.get('id'))
  const price = intOrNull(f, 'price')
  const salePrice = intOrNull(f, 'salePrice')
  if (Number.isNaN(price) || Number.isNaN(salePrice)) return { error: 'Cena mora biti broj.' }

  const parsed = productSchema.safeParse({ name: text(f, 'name'), price, salePrice })
  if (!parsed.success) return { error: parsed.error.issues[0]!.message }
  if (salePrice != null && price != null && salePrice >= price) return { error: 'Akcijska cena mora biti manja od redovne.' }

  const input: ProductInput = {
    name: parsed.data.name,
    // placement: "c:12" (samo kategorija) ili "s:34" (podkategorija; kategorija se izvodi iz nje)
    categoryId: text(f, 'placement').startsWith('c:') ? id(text(f, 'placement').slice(2)) || null : null,
    subcategoryId: text(f, 'placement').startsWith('s:') ? id(text(f, 'placement').slice(2)) || null : null,
    price,
    salePrice,
    shortDescription: textOrNull(f, 'shortDescription')?.slice(0, 255) ?? null,
    description: textOrNull(f, 'description'),
    summary: textOrNull(f, 'summary'),
    condition: textOrNull(f, 'condition')?.slice(0, 60) ?? null,
    inStock: flag(f, 'inStock'),
    visible: flag(f, 'visible'),
    featured: flag(f, 'featured'),
    seoTitle: null,
    seoDescription: null,
  }
  // SEO podaci se uvek automatski generišu iz naziva i opisa proizvoda
  input.seoTitle = input.name.slice(0, 255)
  {
    const body = (input.shortDescription ?? input.description ?? '').replace(/\s+/g, ' ').trim()
    const price = input.salePrice ?? input.price
    const base = body || `${input.name}${price != null ? ` — ${price.toLocaleString('sr-RS')} RSD` : ''}`
    input.seoDescription = base.length > 160 ? `${base.slice(0, 157).trimEnd()}...` : base
  }
  const saved = await saveProduct(productId || null, input)
  // Slike izabrane pri dodavanju novog proizvoda
  const files = f.getAll('images').filter((x): x is File => x instanceof File && x.size > 0)
  const imgErrors: string[] = []
  for (const file of files.slice(0, 20)) {
    const e = await addProductImage(saved, file)
    if (e) imgErrors.push(e)
  }
  if (imgErrors.length) {
    revalidatePath('/', 'layout')
    return {
      error: `Proizvod je sačuvan (#${saved}), ali slike nisu dodate: ${imgErrors.join('; ')}`,
    }
  }
  revalidatePath('/', 'layout')
  redirect(`/admin/proizvodi/${saved}/?ok=1`)
}

export async function toggleVisibleAction(formData: FormData) {
  await requireUser()
  const pid = id(formData.get('id'))
  if (pid) await setProductVisible(pid, formData.get('visible') === '1')
  revalidatePath('/admin/proizvodi')
}

export async function deleteProductAction(formData: FormData) {
  await requireUser()
  const pid = id(formData.get('id'))
  if (!pid) return
  await deleteAllProductImageFiles(pid)
  await getPool().query('DELETE FROM products WHERE id = ?', [pid]) // slike i stavke narudžbina se same čiste (FK)
  redirect('/admin/proizvodi/?obrisano=1')
}

export async function uploadImagesAction(_prev: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const pid = id(f.get('id'))
  const exists = pid && (await row('SELECT id FROM products WHERE id = ?', [pid]))
  if (!exists) return { error: 'Proizvod ne postoji.' }
  const files = f.getAll('images').filter((x): x is File => x instanceof File && x.size > 0)
  if (files.length === 0) return { error: 'Izaberi bar jednu sliku.' }
  const errors: string[] = []
  for (const file of files.slice(0, 20)) {
    const e = await addProductImage(pid, file)
    if (e) errors.push(e)
  }
  revalidatePath(`/admin/proizvodi/${pid}`)
  return errors.length ? { error: errors.join('; ') } : { ok: `Dodato slika: ${files.length}` }
}

export async function deleteImageAction(formData: FormData) {
  await requireUser()
  const imageId = id(formData.get('imageId'))
  if (imageId) await deleteProductImage(imageId)
  revalidatePath(`/admin/proizvodi/${id(formData.get('id'))}`)
}

export async function setMainImageAction(formData: FormData) {
  await requireUser()
  const imageId = id(formData.get('imageId'))
  if (imageId) await setMainImage(imageId)
  revalidatePath(`/admin/proizvodi/${id(formData.get('id'))}`)
}

// ─── Kategorije ──────────────────────────────────────────────────────────────

export async function saveCategoryAction(_prev: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const cid = id(f.get('id'))
  const name = text(f, 'name')
  if (name.length < 2) return { error: 'Naziv je obavezan.' }
  const slug = slugify(text(f, 'slug') || name)
  if (!slug) return { error: 'Slug nije ispravan.' }
  if (await slugTaken(slug, cid ? { table: 'categories', id: cid } : undefined)) {
    return { error: 'Taj slug već koristi druga kategorija ili podkategorija.' }
  }
  const values = [
    name,
    slug,
    textOrNull(f, 'description'),
    textOrNull(f, 'body'),
    textOrNull(f, 'seoTitle'),
    textOrNull(f, 'seoDescription'),
    textOrNull(f, 'pageSeoTitle'),
    textOrNull(f, 'pageSeoDescription'),
    flag(f, 'visible') ? 1 : 0,
  ]
  let savedId = cid
  if (cid) {
    await getPool().query(
      `UPDATE categories SET name=?, slug=?, description=?, body=?, seo_title=?, seo_description=?, page_seo_title=?, page_seo_description=?, visible=? WHERE id=?`,
      [...values, cid],
    )
  } else {
    const [res] = await getPool().query(
      `INSERT INTO categories (name, slug, description, body, seo_title, seo_description, page_seo_title, page_seo_description, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values,
    )
    savedId = (res as { insertId: number }).insertId
  }
  revalidatePath('/', 'layout')
  redirect(`/admin/kategorije/${savedId}/?ok=1`)
}

export async function saveSubcategoryAction(_prev: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const sid = id(f.get('id'))
  const categoryId = id(f.get('categoryId'))
  const name = text(f, 'name')
  if (name.length < 2) return { error: 'Naziv je obavezan.' }
  if (!categoryId || !(await row('SELECT id FROM categories WHERE id = ?', [categoryId]))) return { error: 'Izaberi kategoriju.' }
  const slug = slugify(text(f, 'slug') || name)
  if (!slug) return { error: 'Slug nije ispravan.' }
  if (await slugTaken(slug, sid ? { table: 'subcategories', id: sid } : undefined)) {
    return { error: 'Taj slug već koristi druga kategorija ili podkategorija.' }
  }
  const values = [categoryId, name, slug, textOrNull(f, 'seoTitle'), textOrNull(f, 'seoDescription'), flag(f, 'visible') ? 1 : 0]
  if (sid) {
    await getPool().query('UPDATE subcategories SET category_id=?, name=?, slug=?, seo_title=?, seo_description=?, visible=? WHERE id=?', [
      ...values,
      sid,
    ])
    // Proizvodi podkategorije prate njenu kategoriju
    await getPool().query('UPDATE products SET category_id = ? WHERE subcategory_id = ?', [categoryId, sid])
  } else {
    await getPool().query(
      'INSERT INTO subcategories (category_id, name, slug, seo_title, seo_description, visible) VALUES (?, ?, ?, ?, ?, ?)',
      values,
    )
  }
  revalidatePath('/', 'layout')
  redirect('/admin/kategorije/?ok=1')
}

export async function deleteCategoryAction(formData: FormData) {
  await requireUser()
  const kind = formData.get('kind') === 'sub' ? 'sub' : 'cat'
  const cid = id(formData.get('id'))
  if (!cid) return
  const used =
    kind === 'sub'
      ? await row<{ n: number }>('SELECT COUNT(*) AS n FROM products WHERE subcategory_id = ?', [cid])
      : await row<{ n: number }>(
          'SELECT (SELECT COUNT(*) FROM products WHERE category_id = ?) + (SELECT COUNT(*) FROM subcategories WHERE category_id = ?) AS n',
          [cid, cid],
        )
  if ((used?.n ?? 0) > 0) redirect('/admin/kategorije/?greska=nije-prazna')
  await getPool().query(`DELETE FROM ${kind === 'sub' ? 'subcategories' : 'categories'} WHERE id = ?`, [cid])
  revalidatePath('/', 'layout')
  redirect('/admin/kategorije/?ok=1')
}

// ─── Narudžbine ──────────────────────────────────────────────────────────────

export async function setOrderStatusAction(formData: FormData) {
  await requireUser()
  const oid = id(formData.get('id'))
  if (oid) await setOrderStatus(oid, text(formData, 'status'))
  revalidatePath(`/admin/narudzbine/${oid}`)
  redirect(`/admin/narudzbine/${oid}/?ok=1`)
}

// ─── Upiti kupaca ────────────────────────────────────────────────────────────

export async function setInquiryStatusAction(formData: FormData) {
  await requireUser()
  const iid = id(formData.get('id'))
  if (iid) await setInquiryStatus(iid, text(formData, 'status'))
  revalidatePath('/admin/upiti')
  redirect(`/admin/upiti/${iid}/?ok=1`)
}

export async function deleteInquiryAction(formData: FormData) {
  await requireUser()
  const iid = id(formData.get('id'))
  if (iid) await deleteInquiry(iid)
  revalidatePath('/admin/upiti')
  redirect('/admin/upiti/')
}

// ─── Korisnici (samo administratori) ─────────────────────────────────────────

const roleOf = (v: string): 'admin' | 'editor' => (v === 'admin' ? 'admin' : 'editor')

function usersDone(r: { ok: boolean; error?: string }): never {
  revalidatePath('/admin/korisnici')
  redirect(r.ok ? '/admin/korisnici/?ok=1' : `/admin/korisnici/?greska=${encodeURIComponent(r.error ?? 'Greška')}`)
}

export async function addUserAction(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin()
  const r = await addUser({
    email: text(f, 'email'),
    name: text(f, 'name'),
    role: roleOf(text(f, 'role')),
    password: String(f.get('password') ?? ''),
  })
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin/korisnici')
  return { ok: `Korisnik ${text(f, 'email').toLowerCase()} je dodat.` }
}

export async function setUserRoleAction(f: FormData) {
  const me = await requireAdmin()
  usersDone(await setUserRole(id(f.get('id')), roleOf(text(f, 'role')), me.id))
}

export async function setUserPasswordAction(f: FormData) {
  const me = await requireAdmin()
  usersDone(await setUserPassword(id(f.get('id')), String(f.get('password') ?? ''), me.id))
}

export async function deleteUserAction(f: FormData) {
  const me = await requireAdmin()
  usersDone(await deleteUser(id(f.get('id')), me.id))
}
