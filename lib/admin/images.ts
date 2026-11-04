import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { getPool, row, rows } from '@/lib/db'
import { UPLOADS_DIR } from '@/lib/uploads'

const MAX_SIDE = 800
const THUMB_SIDE = 300
const MAX_BYTES = 12 * 1024 * 1024

const abs = (rel: string) => path.join(UPLOADS_DIR, rel)
const rm = (rel?: string | null) => rel && fs.promises.rm(abs(rel), { force: true }).catch(() => {})

async function writeMain(buf: Buffer, rel: string) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true })
  const out = await sharp(buf)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer({ resolveWithObject: true })
  await fs.promises.writeFile(abs(rel), out.data)
  return out.info
}

async function writeThumb(buf: Buffer, rel: string) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true })
  const t = await sharp(buf)
    .rotate()
    .resize({ width: THUMB_SIDE, height: THUMB_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer()
  await fs.promises.writeFile(abs(rel), t)
}

const shard = (productId: number) => String(productId % 100).padStart(2, '0')

/** Dodaje sliku proizvodu (na kraj). Prva slika postaje glavna i dobija sličicu. */
export async function addProductImage(productId: number, file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return `${file.name}: nije slika`
  if (file.size > MAX_BYTES) return `${file.name}: veća od 12 MB`
  const buf = Buffer.from(await file.arrayBuffer())
  try {
    await sharp(buf).metadata()
  } catch {
    return `${file.name}: nije ispravna slika`
  }

  const rev = crypto.randomBytes(3).toString('hex') // novo ime fajla = nema starog keša u browseru
  const pos =
    (await row<{ pos: number }>('SELECT COALESCE(MAX(position) + 1, 0) AS pos FROM product_images WHERE product_id = ?', [
      productId,
    ]))?.pos ?? 0
  const rel = `${shard(productId)}/${productId}-${pos}-${rev}.webp`
  const relThumb = `${shard(productId)}/${productId}-${pos}-${rev}-t.webp`
  const info = await writeMain(buf, rel)
  let thumb: string | null = null
  if (pos === 0) {
    await writeThumb(buf, relThumb)
    thumb = relThumb
  }
  const product = await row<{ name: string }>('SELECT name FROM products WHERE id = ?', [productId])
  await getPool().query(
    'INSERT INTO product_images (product_id, position, path, thumb_path, width, height, alt, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      productId,
      pos,
      rel,
      thumb,
      info.width,
      info.height,
      (product?.name ?? '').slice(0, 255),
      crypto.createHash('sha1').update(buf).digest('hex'),
    ],
  )
  return null
}

export async function deleteProductImage(imageId: number) {
  const img = await row<{ id: number; product_id: number; path: string; thumb_path: string | null; position: number }>(
    'SELECT id, product_id, path, thumb_path, position FROM product_images WHERE id = ?',
    [imageId],
  )
  if (!img) return
  await getPool().query('DELETE FROM product_images WHERE id = ?', [img.id])
  await rm(img.path)
  await rm(img.thumb_path)
  // Ako je obrisana glavna slika, sledeća po redu postaje glavna
  if (img.thumb_path) await promoteFirst(img.product_id)
}

/** Prva slika proizvoda dobija sličicu, ostale je nemaju. */
async function promoteFirst(productId: number) {
  const list = await rows<{ id: number; path: string; thumb_path: string | null; position: number }>(
    'SELECT id, path, thumb_path, position FROM product_images WHERE product_id = ? AND path <> \'\' ORDER BY position',
    [productId],
  )
  const [first, ...others] = list
  for (const o of others) {
    if (o.thumb_path) {
      await rm(o.thumb_path)
      await getPool().query('UPDATE product_images SET thumb_path = NULL WHERE id = ?', [o.id])
    }
  }
  if (first && !first.thumb_path) {
    const rel = first.path.replace(/\.webp$/, '-t.webp')
    await writeThumb(await fs.promises.readFile(abs(first.path)), rel)
    await getPool().query('UPDATE product_images SET thumb_path = ? WHERE id = ?', [rel, first.id])
  }
}

/** Postavlja sliku kao glavnu (pozicija 0); ostale se pomeraju. */
export async function setMainImage(imageId: number) {
  const img = await row<{ product_id: number }>('SELECT product_id FROM product_images WHERE id = ?', [imageId])
  if (!img) return
  const list = await rows<{ id: number }>('SELECT id FROM product_images WHERE product_id = ? ORDER BY position', [
    img.product_id,
  ])
  const order = [imageId, ...list.map((l) => l.id).filter((id) => id !== imageId)]
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    // Prvo odmaknemo pozicije da jedinstveni indeks (product_id, position) ne smeta
    await conn.query('UPDATE product_images SET position = position + 1000 WHERE product_id = ?', [img.product_id])
    for (let i = 0; i < order.length; i++) {
      await conn.query('UPDATE product_images SET position = ? WHERE id = ?', [i, order[i]])
    }
    await conn.commit()
  } finally {
    conn.release()
  }
  await promoteFirst(img.product_id)
}

/** Briše sve fajlove slika proizvoda (poziva se pri brisanju proizvoda). */
export async function deleteAllProductImageFiles(productId: number) {
  const list = await rows<{ path: string; thumb_path: string | null }>(
    'SELECT path, thumb_path FROM product_images WHERE product_id = ?',
    [productId],
  )
  for (const i of list) {
    await rm(i.path)
    await rm(i.thumb_path)
  }
}
