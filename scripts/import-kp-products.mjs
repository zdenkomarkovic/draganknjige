// Uvozi proizvode sa KupujemProdajem izloga (irex012.kpizlog.rs) u Sanity.
// Kategorija/podkategorija se uzimaju iz URL-a oglasa (slug podkategorije = slug u Sanity-ju).
// Pregled:  node --env-file=.env.local scripts/import-kp-products.mjs
// Upis:     node --env-file=.env.local scripts/import-kp-products.mjs --apply
import { createClient } from '@sanity/client'

const apply = process.argv.includes('--apply')
const SHOP = 'https://irex012.kpizlog.rs'
// Po jedan oglas iz 10 različitih podkategorija
const GROUPS = [
  '/knjige/beletristika-domaci-pisci/grupa/8/1125/1',
  '/knjige/istorija-i-istorijski-romani/grupa/8/305/1',
  '/knjige/naucna-fantastika/grupa/8/355/1',
  '/knjige/poezija/grupa/8/581/1',
  '/casopisi-i-stripovi/stripovi-alan-ford/grupa/1296/1208/1',
  '/audio-vinili-cd-i-kasete/vinili-strani-originali/grupa/1176/869/1',
  '/kolekcionarstvo/slicice-i-albumi/grupa/584/589/1',
  '/kolekcionarstvo/razglednice-domace/grupa/584/578/1',
  '/igracke-i-igre/drustvene-igre/grupa/1157/724/1',
  '/konzole-i-igrice/igrice-za-pc/grupa/1036/84/1',
]

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const UA = { 'User-Agent': 'Mozilla/5.0' }
const text = async (url) => (await fetch(url, { headers: UA })).text()
const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
const slugify = (t) =>
  t
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Prvi oglas sa stranice grupe: { url, price }
async function firstAd(group) {
  const html = await text(SHOP + group)
  const m = html.match(
    /<a href="(https:\/\/www\.kupujemprodajem\.com\/([^/]+)\/([^/]+)\/[^"]*?\/oglas\/(\d+))"[^>]*>.*?class="price">(.*?)<\/div>/s,
  )
  if (!m) throw new Error(`Nema oglasa: ${group}`)
  return { url: m[1], sub: m[3], id: m[4], price: Number(decode(m[5]).replace(/[^\d]/g, '')) }
}

const subs = await client.fetch(`*[_type == "subcategory"]{ _id, "slug": slug.current, "category": category._ref }`)

const ads = []
for (const g of GROUPS) {
  let ad
  try {
    ad = await firstAd(g)
  } catch (e) {
    console.log(`Preskačem ${g}: ${e.message}`)
    continue
  }
  // KupujemProdajem ograničava učestale zahteve: pauza između oglasa, a prazna stranica ("Oglas") se ponavlja sa dužom pauzom
  let html = ''
  for (const wait of [4000, 20000, 60000]) {
    await new Promise((r) => setTimeout(r, wait))
    html = await text(ad.url)
    if (!/og:title" content="Oglas/.test(html)) break
  }
  const meta = (p) => html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`))?.[1] ?? ''
  const name = decode(meta('og:title')).replace(/\s*-\s*KupujemProdajem$/, '').replace(/\s+/g, ' ')
  const description = decode(meta('og:description'))
  const images = [...new Set([...html.matchAll(/https:\/\/images\.kupujemprodajem\.com\/photos\/oglasi\/[^"'\s]*?\/big-[^"'\s]+\.(?:jpe?g|png|webp)/gi)].map((x) => x[0]))]
  if (!name || name === 'Oglas') {
    console.log(`Preskačem ${ad.url}: stranica nije dostupna`)
    continue
  }
  const sub = subs.find((s) => s.slug === ad.sub)
  if (!sub) {
    console.log(`Preskačem "${name}": nema podkategorije "${ad.sub}" u Sanity-ju`)
    continue
  }
  ads.push({ ...ad, name, description, images, sub })
}

for (const a of ads) {
  console.log(`- ${a.name} | ${a.price} RSD | ${a.sub.slug} | slika: ${a.images.length}\n    ${a.description.slice(0, 100)}`)
}
if (!apply) {
  console.log(`\nPregled: ${ads.length} proizvoda, ništa se ne upisuje.`)
  process.exit(0)
}

for (const a of ads) {
  const images = []
  for (const url of a.images.slice(0, 6)) {
    const res = await fetch(url, { headers: UA })
    if (!res.ok) continue
    const asset = await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), { filename: url.split('/').pop() })
    images.push({ _key: asset._id.slice(-12), _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: a.name })
  }
  const slug = `${slugify(a.name)}-${a.id}`
  await client.createOrReplace({
    _id: `product-kp-${a.id}`,
    _type: 'product',
    name: a.name,
    slug: { _type: 'slug', current: slug },
    category: { _type: 'reference', _ref: a.sub.category },
    subcategory: { _type: 'reference', _ref: a.sub._id },
    price: a.price,
    images,
    shortDescription: a.description.slice(0, 160),
    // Svaki red opisa je poseban pasus
    description: a.description
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => ({
        _key: `d${i}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: `s${i}`, _type: 'span', text: line, marks: [] }],
      })),
    inStock: true,
    featured: false,
  })
  console.log(`Upisano: ${a.name} (${images.length} slika)`)
}
