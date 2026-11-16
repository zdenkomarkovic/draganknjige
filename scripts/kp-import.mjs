// Uvoz proizvoda sa KupujemProdajem izloga (irex012.kpizlog.rs) u MariaDB.
// Radi u fazama i može da se prekine (Ctrl+C) i nastavi – stanje je u bazi (products.import_status).
//
//   node --env-file=.env.local scripts/kp-import.mjs categories        kategorije i podkategorije sa početne stranice
//   node --env-file=.env.local scripts/kp-import.mjs links             prolazi kroz liste i upisuje sve oglase (status "link")
//   node --env-file=.env.local scripts/kp-import.mjs details           otvara svaki oglas: pun opis, datum, lista slika (status "details")
//   node --env-file=.env.local scripts/kp-import.mjs images            skida i smanjuje slike (status "done")
//   node --env-file=.env.local scripts/kp-import.mjs stats             pregled stanja
//
// Opcije: --limit=N (ograniči broj), --group=ID (samo jedna KP podkategorija), --delay=ms (pauza između zahteva, default 800)
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import * as cheerio from 'cheerio'
import mysql from 'mysql2/promise'
import sharp from 'sharp'

const SHOP = 'https://irex012.kpizlog.rs'
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }
const ROOT = path.resolve(import.meta.dirname, '..')
const UPLOADS = process.env.UPLOADS_DIR ?? path.join(ROOT, 'uploads')
const DATA_DIR = path.join(ROOT, 'import-data')
const MAX_SIDE = 800
const THUMB_SIDE = 300
const MIN_FREE_BYTES = 1024 ** 3 // staje kad na disku ostane manje od 1 GB

const [cmd, ...rest] = process.argv.slice(2)
const opt = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
const LIMIT = opt.limit ? Number(opt.limit) : Infinity
const BASE_DELAY = Number(opt.delay ?? 800)

const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, charset: 'utf8mb4' })

// ─── Pomoćne funkcije ────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slugify = (t) =>
  t
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
const clean = (s) => s.replace(/\s+/g, ' ').trim()

// Razmak između zahteva ka KP-u; kad dobijemo blokadu, usporava, a kad prođe, polako ubrzava
class Gate {
  constructor(minMs) {
    this.base = minMs
    this.minMs = minMs
    this.next = 0
    this.ok = 0
  }
  async wait() {
    const now = Date.now()
    const at = Math.max(now, this.next)
    this.next = at + this.minMs
    if (at > now) await sleep(at - now)
  }
  slower() {
    this.minMs = Math.min(Math.round(this.minMs * 1.5), Math.max(4000, this.base * 2))
    this.ok = 0
  }
  good() {
    if (++this.ok >= 15 && this.minMs > this.base) {
      this.minMs = Math.max(this.base, Math.round(this.minMs / 1.3))
      this.ok = 0
    }
  }
}
const pageGate = new Gate(BASE_DELAY)

async function getHtml(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await pageGate.wait()
    try {
      const res = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(30000) })
      if (res.ok || res.status === 410) {
        const html = await res.text()
        // 410 sa praznom stranicom ("Oglas") = blokada; 410 sa pravim sadržajem se ne dešava
        if (res.status === 410) return { status: 410, html: '' } // obrisan oglas (ili blokada – razlikuje details())
        if (/og:title" content="Oglas/.test(html)) return { status: 410, html: '' } // placeholder = obrisan oglas ili blokada
        pageGate.good()
        return { status: 200, html }
      }
      if (res.status === 404) return { status: 404, html: '' }
    } catch {
      /* mrežna greška – ponovi */
    }
    pageGate.slower()
    await sleep(15000 * (attempt + 1))
  }
  return { status: 0, html: '' }
}

function freeBytes() {
  fs.mkdirSync(UPLOADS, { recursive: true })
  const s = fs.statfsSync(UPLOADS)
  return s.bavail * s.bsize
}

// Radnici koji paralelno obrađuju red; staje čim `stop` postane true
async function pool(items, concurrency, fn) {
  let i = 0
  let stop = false
  const workers = Array.from({ length: concurrency }, async () => {
    while (!stop) {
      const idx = i++
      if (idx >= items.length) return
      if ((await fn(items[idx], idx)) === 'stop') stop = true
    }
  })
  await Promise.all(workers)
}

process.on('SIGINT', async () => {
  console.log('\nPrekinuto – stanje je sačuvano, nastavi istom komandom.')
  await db.end().catch(() => {})
  process.exit(0)
})

// ─── Faza 1: kategorije ──────────────────────────────────────────────────────

async function categories() {
  const { html } = await getHtml(SHOP + '/')
  const $ = cheerio.load(html)
  const cats = new Map() // kpId → { slug, name }
  const groups = [] // { catKp, subKp, catSlug, subSlug, name }

  $('a[href]').each((_, a) => {
    const href = $(a).attr('href')
    const name = clean($(a).text())
    let m = href.match(/^\/([^/]+)\/kategorija\/(\d+)$/)
    if (m) cats.set(Number(m[2]), { slug: m[1], name })
    m = href.match(/^\/([^/]+)\/([^/]+)\/grupa\/(\d+)\/(\d+)\/\d+$/)
    if (m) groups.push({ catSlug: m[1], subSlug: m[2], catKp: Number(m[3]), subKp: Number(m[4]), name })
  })
  // Kategorije koje nemaju svoj link na početnoj dobijaju naziv iz sluga
  for (const g of groups) {
    if (!cats.has(g.catKp)) cats.set(g.catKp, { slug: g.catSlug, name: g.catSlug.replace(/-/g, ' ') })
  }

  const used = new Set()
  const [existingCats] = await db.query('SELECT id, slug FROM categories')
  const [existingSubs] = await db.query('SELECT id, slug FROM subcategories')
  existingCats.forEach((r) => used.add(r.slug))
  existingSubs.forEach((r) => used.add(r.slug))

  const catDbId = new Map()
  for (const [kp, c] of cats) {
    await db.query(
      'INSERT INTO categories (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), id = LAST_INSERT_ID(id)',
      [c.name, c.slug],
    )
    const [[row]] = await db.query('SELECT id FROM categories WHERE slug = ?', [c.slug])
    catDbId.set(kp, row.id)
    used.add(c.slug)
  }

  const map = {}
  for (const g of groups) {
    const catId = catDbId.get(g.catKp)
    // Podkategorije se često zovu isto ("ostalo"); slug mora biti jedinstven, pa dobije prefiks kategorije
    const [[mine]] = await db.query('SELECT id, slug FROM subcategories WHERE category_id = ? AND (slug = ? OR slug = ?)', [
      catId,
      g.subSlug,
      `${g.catSlug}-${g.subSlug}`,
    ])
    let subId
    if (mine) {
      subId = mine.id
      await db.query('UPDATE subcategories SET name = ? WHERE id = ?', [g.name, subId])
    } else {
      const slug = used.has(g.subSlug) ? `${g.catSlug}-${g.subSlug}` : g.subSlug
      const [r] = await db.query('INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)', [catId, g.name, slug])
      subId = r.insertId
      used.add(slug)
    }
    map[g.subKp] = { catId, subId, catKp: g.catKp, path: `/${g.catSlug}/${g.subSlug}/grupa/${g.catKp}/${g.subKp}` }
  }
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, 'groups.json'), JSON.stringify(map, null, 2))
  console.log(`Kategorija: ${cats.size}, podkategorija: ${groups.length}`)
}

// ─── Faza 2: linkovi (liste) ─────────────────────────────────────────────────

async function links() {
  const groupsFile = path.join(DATA_DIR, 'groups.json')
  if (!fs.existsSync(groupsFile)) throw new Error('Prvo pokreni: categories')
  const groups = JSON.parse(fs.readFileSync(groupsFile, 'utf8'))
  const todo = Object.entries(groups).filter(([kp]) => !opt.group || kp === opt.group)
  let total = 0

  for (const [kp, g] of todo) {
    let prevKey = ''
    let count = 0
    for (let page = 1; ; page++) {
      const { html, status } = await getHtml(`${SHOP}${g.path}/${page}`)
      if (status !== 200) {
        console.log(`  ! ${g.path}/${page}: nedostupno, preskačem ostatak grupe`)
        break
      }
      const $ = cheerio.load(html)
      const ads = []
      $('.listingHolder').each((_, el) => {
        const a = $(el).find('a[action-name="ad-view"]').first()
        const url = a.attr('href')?.split('?')[0]
        const id = url?.match(/\/oglas\/(\d+)/)?.[1]
        if (!id) return
        const price = Number(clean($(el).find('.price').text()).replace(/\./g, '').match(/\d+/)?.[0])
        ads.push({
          id: Number(id),
          url,
          name: clean($(el).find('.title').text()),
          price: Number.isFinite(price) ? price : null,
          desc: clean($(el).find('.description').text()).replace(/\s*\.{3}$/, ''),
        })
      })
      // Posle poslednje strane sajt vraća poslednju stranu ponovo
      const key = ads.map((a) => a.id).join(',')
      if (!ads.length || key === prevKey) break
      prevKey = key

      const rows = ads.filter((a) => a.name)
      if (rows.length) {
        await db.query(
          `INSERT INTO products (kp_id, source_url, name, slug, category_id, subcategory_id, price, short_description, import_status)
           VALUES ? ON DUPLICATE KEY UPDATE source_url = VALUES(source_url), subcategory_id = VALUES(subcategory_id), category_id = VALUES(category_id)`,
          [
            rows.map((a) => [
              a.id,
              a.url,
              a.name.slice(0, 255),
              `${slugify(a.name) || 'proizvod'}-${a.id}`,
              g.catId,
              g.subId,
              a.price,
              a.desc.slice(0, 255),
              'link',
            ]),
          ],
        )
      }
      count += ads.length
      if (ads.length < 24) break
    }
    total += count
    console.log(`${g.path} → ${count} oglasa (ukupno ${total})`)
    if (total >= LIMIT) break
  }
  console.log(`Gotovo: ${total} oglasa u listama.`)
}

// ─── Faza 3: detalji oglasa ──────────────────────────────────────────────────

function findAd(obj) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj.photos) && obj.adUrl && obj.formattedName !== undefined) return obj
    for (const k in obj) {
      const r = findAd(obj[k])
      if (r) return r
    }
  }
}

function htmlToText(html) {
  const $ = cheerio.load(`<div id="r">${html}</div>`)
  $('br').replaceWith('\n')
  $('p, div, li').each((_, el) => void $(el).append('\n'))
  return $('#r')
    .text()
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function details() {
  const [rows] = await db.query(
    "SELECT id, kp_id, source_url FROM products WHERE import_status = 'link' ORDER BY id LIMIT ?",
    [Number.isFinite(LIMIT) ? LIMIT : 10_000_000],
  )
  console.log(`Za obradu: ${rows.length} oglasa`)
  let done = 0
  let skipped = 0
  const [[ctl]] = await db.query("SELECT source_url FROM products WHERE import_status='done' AND visible=1 AND description <> '' ORDER BY id DESC LIMIT 1")
  const controlUrl = ctl.source_url
  let gone10 = 0
  let goneTotal = 0
  const t0 = Date.now()

  await pool(rows, Number(opt.concurrency ?? 2), async (p) => {
    let ad
    for (let attempt = 0; attempt < 3 && !ad; attempt++) {
      const { html, status } = await getHtml(p.source_url)
      if (status === 410) {
        // Obrisan oglas ili blokada: razlikujemo kontrolnim oglasom koji uvek postoji
        if ((await getHtml(p.source_url)).status === 410) {
          if ((await getHtml(controlUrl)).status === 410) {
            console.log('  ! blokada (kontrolni oglas 410) – pauza 10 min')
            pageGate.slower()
            await sleep(600000)
            skipped++
            return
          }
          await db.query("UPDATE products SET visible = 0, import_status = 'done' WHERE id = ?", [p.id])
          goneTotal++
          return
        }
        continue
      }
      gone10 = 0
      // 404/410 vraća i KP kad privremeno blokira prevelik broj zahteva, pa se NIKAD ne briše na osnovu toga;
      // oglas ostaje u statusu "link" i probaće se ponovo pri sledećem pokretanju.
      const json = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1]
      const found = json && findAd(JSON.parse(json))
      if (found && found.formattedName && found.formattedName !== 'Oglas') ad = found
      else {
        pageGate.slower()
        await sleep(5000 * (attempt + 1))
      }
    }
    if (!ad) {
      skipped++
      return
    }
    const text = htmlToText(ad.description ?? '')
    const name = clean(ad.formattedName || ad.name).slice(0, 255)
    const photos = (ad.photos ?? []).map((ph) => ph.original || ph.fullscreen).filter(Boolean)
    const created = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(ad.postedRaw ?? '') ? ad.postedRaw : null

    await db.query('DELETE FROM product_images WHERE product_id = ?', [p.id])
    if (photos.length) {
      await db.query('INSERT INTO product_images (product_id, position, path, alt, source_url) VALUES ?', [
        photos.map((url, i) => [p.id, i, '', name.slice(0, 255), url]),
      ])
    }
    await db.query(
      `UPDATE products SET name = ?, slug = ?, description = ?, short_description = ?, price = COALESCE(?, price),
         created_at = COALESCE(?, created_at), \`condition\` = ?, import_status = 'details' WHERE id = ?`,
      [
        name,
        `${slugify(name) || 'proizvod'}-${p.kp_id}`,
        text || null,
        clean(text).slice(0, 160) || null,
        Number.isFinite(ad.priceNumber) && ad.priceNumber > 0 ? ad.priceNumber : null,
        created,
        clean(ad.condition ?? '').slice(0, 60) || null,
        p.id,
      ],
    )
    done++
    if (done % 100 === 0) {
      const rate = done / ((Date.now() - t0) / 1000)
      console.log(`  detalji: ${done}/${rows.length} (preskočeno ${skipped}), ${rate.toFixed(2)}/s, ~${Math.round((rows.length - done) / rate / 60)} min do kraja`)
    }
  })
  console.log(`Gotovo: ${done} obrađeno, ${skipped} preskočeno (pokreni opet da pokuša preskočene).`)
}

// ─── Faza 4: slike ───────────────────────────────────────────────────────────

const imgGate = new Gate(Number(opt.imgdelay ?? 150))

async function download(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await imgGate.wait()
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) })
      if (res.status === 404 || res.status === 410) return null
      if (res.ok) {
        const b = Buffer.from(await res.arrayBuffer())
        if (b.length < 100) return null // prazan odgovor, nije slika
        imgGate.good()
        return b
      }
    } catch {
      /* ponovi */
    }
    imgGate.slower()
    await sleep(5000 * (attempt + 1))
  }
  return null
}

async function images() {
  const [prods] = await db.query(
    "SELECT id FROM products WHERE import_status = 'details' ORDER BY id LIMIT ?",
    [Number.isFinite(LIMIT) ? LIMIT : 10_000_000],
  )
  console.log(`Za obradu: ${prods.length} proizvoda`)
  let done = 0
  let nImg = 0
  let bytes = 0
  const t0 = Date.now()

  await pool(prods, Number(opt.concurrency ?? 4), async (p) => {
    if (freeBytes() < MIN_FREE_BYTES) {
      console.log('STOP: na disku je ostalo manje od 1 GB. Oslobodi prostor i pokreni opet – nastavlja odatle.')
      return 'stop'
    }
    const [imgs] = await db.query('SELECT id, position, source_url FROM product_images WHERE product_id = ? ORDER BY position', [p.id])
    let first = true
    for (const im of imgs) {
      let buf = await download(im.source_url)
      if (!buf) {
        await db.query('DELETE FROM product_images WHERE id = ?', [im.id])
        continue
      }
      let meta
      try {
        meta = await sharp(buf).metadata()
      } catch {
        await db.query('DELETE FROM product_images WHERE id = ?', [im.id])
        continue
      }
      // "big-" varijanta je manja; ako je kraća strana od MAX_SIDE, uzimamo punu veličinu
      if (Math.max(meta.width ?? 0, meta.height ?? 0) < MAX_SIDE && /\/big-/.test(im.source_url)) {
        const full = await download(im.source_url.replace('/big-', '/'))
        if (full) {
          buf = full
          meta = await sharp(buf).metadata()
        }
      }
      const hash = crypto.createHash('sha1').update(buf).digest('hex')
      const shard = String(p.id % 100).padStart(2, '0')
      const rel = `${shard}/${p.id}-${im.position}.webp`
      const relThumb = `${shard}/${p.id}-${im.position}-t.webp`
      fs.mkdirSync(path.join(UPLOADS, shard), { recursive: true })

      const out = await sharp(buf)
        .rotate()
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer({ resolveWithObject: true })
      fs.writeFileSync(path.join(UPLOADS, rel), out.data)
      bytes += out.data.length
      let thumb = null
      if (first) {
        const t = await sharp(buf)
          .rotate()
          .resize({ width: THUMB_SIDE, height: THUMB_SIDE, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer()
        fs.writeFileSync(path.join(UPLOADS, relThumb), t)
        bytes += t.length
        thumb = relThumb
        first = false
      }
      await db.query('UPDATE product_images SET path = ?, thumb_path = ?, width = ?, height = ?, hash = ? WHERE id = ?', [
        rel,
        thumb,
        out.info.width,
        out.info.height,
        hash,
        im.id,
      ])
      nImg++
    }
    await db.query("UPDATE products SET import_status = 'done', imported_at = NOW() WHERE id = ?", [p.id])
    done++
    if (done % 50 === 0) {
      const rate = done / ((Date.now() - t0) / 1000)
      console.log(
        `  slike: ${done}/${prods.length} proizvoda, ${nImg} slika, ${(bytes / 1024 ** 2).toFixed(0)} MB, ${rate.toFixed(2)}/s, ` +
          `~${Math.round((prods.length - done) / rate / 60)} min do kraja, slobodno ${(freeBytes() / 1024 ** 3).toFixed(1)} GB`,
      )
    }
  })
  console.log(`Gotovo: ${done} proizvoda, ${nImg} slika, ${(bytes / 1024 ** 2).toFixed(0)} MB.`)
}

// ─── Statistika ──────────────────────────────────────────────────────────────

async function stats() {
  const [byStatus] = await db.query('SELECT import_status AS status, COUNT(*) AS n FROM products GROUP BY import_status')
  const [[img]] = await db.query("SELECT COUNT(*) AS n, SUM(path <> '') AS gotove FROM product_images")
  const [[c]] = await db.query('SELECT (SELECT COUNT(*) FROM categories) AS kat, (SELECT COUNT(*) FROM subcategories) AS pod')
  console.log('Kategorija:', c.kat, '| podkategorija:', c.pod)
  console.log('Proizvodi po statusu:', Object.fromEntries(byStatus.map((r) => [r.status, r.n])))
  console.log(`Slike: ${img.n} (skinuto ${img.gotove ?? 0})`)
  console.log(`Slobodno na disku slika: ${(freeBytes() / 1024 ** 3).toFixed(1)} GB`)
}

const commands = { categories, links, details, images, stats }
if (!commands[cmd]) {
  console.log('Komande: ' + Object.keys(commands).join(', '))
  process.exit(1)
}
try {
  await commands[cmd]()
} finally {
  await db.end().catch(() => {})
}
