import { SITE_NAME } from './constants'
import type { Product } from '@/types/shop'

// Automatsko generisanje SEO tekstova — klijent ništa ne unosi, sve se gradi iz podataka proizvoda/kategorije.

const strip = (s = '') =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const cut = (s: string, max: number) => {
  if (s.length <= max) return s
  const t = s.slice(0, max - 1)
  return t.slice(0, t.lastIndexOf(' ') > 40 ? t.lastIndexOf(' ') : t.length).replace(/[\s,.;:–-]+$/, '') + '…'
}

const rsd = (n: number) => `${n.toLocaleString('sr-RS')} RSD`

export function productTitle(p: Product): string {
  const price = p.salePrice ?? p.price
  // Ukupan title: "Naziv – 1.200 RSD | SITE_NAME" (do ~60 znakova pre brenda)
  return cut(price != null ? `${p.name} – ${rsd(price)}` : p.name, 70)
}

// Iz opisa izbacuje interne šifre u zagradi ("(G4bL)", "(DG)") i oznake tipa "Naziv:", i ne ponavlja naziv knjige
function cleanExtra(text: string, name: string): string {
  let t = text.replace(/\([A-Za-z0-9]{1,6}\)/g, ' ').replace(/Naziv\s*:/gi, ' ')
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  t = t.replace(new RegExp(esc, 'gi'), ' ')
  return t.replace(/\s+/g, ' ').replace(/^[\s.,;:–-]+/, '').trim()
}

export function productDescription(p: Product): string {
  const price = p.salePrice ?? p.price
  const base = `Kupite ${p.name}${p.category ? ` (${p.category.name})` : ''}${price != null ? ` po ceni od ${rsd(price)}` : ''}.`
  const extra = cleanExtra(strip(p.summary || p.shortDescription || p.description), p.name)
  const tail = ' Dostava poštom, plaćanje pouzećem.'
  const room = 158 - base.length - tail.length - 1
  return (base + (extra && room > 30 ? ' ' + cut(extra, room) : '') + tail).trim()
}

export const productAlt = (p: { name: string; category?: { name: string } }, index = 0) =>
  `${p.name}${p.category ? ` – ${p.category.name}` : ''}${index > 0 ? ` (slika ${index + 1})` : ''}`

export function categoryIntro(name: string, total?: number): string {
  const n = total ? ` U ponudi je ${total} ${total === 1 ? 'proizvod' : 'proizvoda'}.` : ''
  return `${name} na ${SITE_NAME}.${n} Pogledajte ponudu, izaberite i naručite online — knjige šaljemo poštom na vašu adresu, a plaćanje je pouzećem prilikom preuzimanja.`
}

export const categoryDescription = (name: string) =>
  `${name} — pogledajte ponudu i naručite online. Dostava poštom, plaćanje pouzećem.`
