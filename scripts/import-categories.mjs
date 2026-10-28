// Unosi kategorije i podkategorije u Sanity.
// Pregled:  node --env-file=.env.local scripts/import-categories.mjs
// Upis:     node --env-file=.env.local scripts/import-categories.mjs --apply
import { createClient } from '@sanity/client'

const TREE = {
  'Alati i oruđa': ['Stolarski', 'Za merenje'],
  'Antikviteti': ['Stari rariteti'],
  'Asesoari': ['Deca | Kape, šalovi i rukavice', 'Muškarci | Kaiševi', 'Muškarci | Kravate, mašne i manžetne', 'Privesci za ključeve', 'Ostalo'],
  'Audio': ['Magnetofoni i trake', 'Audio | Vinili, CD i kasete', 'Audio kasete | Domaće', 'Audio kasete | Prazne', 'Audio kasete | Strane', 'Originalni CD-ovi | Domaći', 'Originalni CD-ovi | Klasika', 'Originalni CD-ovi | Strani', 'Vinili | Domaći narodni', 'Vinili | Domaći ostalo', 'Vinili | Domaći pop i rock', 'Vinili | Klasična muzika', 'Vinili | Licencirani', 'Vinili | Maxi singl', 'Vinili | Singl domaći', 'Vinili | Strani originali', 'Ostalo'],
  'Auto oprema': ['Uputstva za upotrebu', 'Ostalo'],
  'Bela tehnika i kućni aparati': ['Mašine za šivenje'],
  'Bicikli': ['Dečji bicikli i trotineti'],
  'Časopisi i stripovi': ['Časopisi | Automobili', 'Časopisi | Hobi', 'Časopisi | Moda i dizajn', 'Časopisi | Nauka', 'Časopisi | Politikin i Mikijev zabavnik', 'Časopisi | Sport i razonoda', 'Časopisi | Umetnost', 'Časopisi | Uređenje kuće', 'Časopisi | Ostalo', 'Pisani romani', 'Strip albumi i revije', 'Stripovi | Alan Ford', 'Stripovi | Bonelli', 'Stripovi | Ludens', 'Stripovi | Lunov Magnus Strip', 'Stripovi | Manga', 'Stripovi | Veseli četvrtak', 'Stripovi | Zlatna serija', 'Stripovi | Ostalo'],
  'Elektronika i komponente': ['Releji', 'Ostalo'],
  'Etno stvari': ['Ćilimi i tapiserije'],
  'Fitnes i vežbanje': ['Ostalo'],
  'Igračke i igre': ['Akcione figure', 'Društvene igre', 'Edukativne igračke i igre', 'Igračke za bebe', 'Kockice', 'Kostimi i maske za decu', 'Lutke', 'Plišane igračke', 'Setovi za igru', 'Slagalice', 'Sportske igračke', 'Vozila | Igračke, garaže i staze', 'Ostalo'],
  'Knjige': ['Akcija, krimi i triler', 'Alternativna učenja', 'Automobilistika', 'Beletristika | Domaći pisci', 'Beletristika | Strani pisci', 'Biografije i autobiografije', 'Biznis i ekonomija', 'Enciklopedije i atlasi', 'Ezoterija', 'Film i pozorište', 'Filozofija i sociologija', 'Hobi, sport i razonoda', 'Hrana i piće', 'Istorija i istorijski romani', 'Izdanja na stranim jezicima', 'Klasična književnost', 'Knjige za roditelje i bebe', 'Književni eseji, kritike i studije', 'Komedija i satira', 'Kompjuteri i internet', 'Marketing i menadžment', 'Medicina i zdravlje', 'Moda', 'Monografije, antologije i sabrana dela', 'Muzika', 'Naučna fantastika', 'Nauka i popularna nauka', 'Poezija', 'Politika', 'Poljoprivreda', 'Pravo', 'Psihologija i pedagogija', 'Putopisi', 'Religija, teologija i mitologija', 'Stare knjige', 'Strani jezici i rečnici', 'Tehnika', 'Tinejdž i knjige za decu', 'Umetnost, arhitektura i dizajn', 'Vodiči i mape', 'Ostalo'],
  'Kolekcionarstvo': ['Breweriana', 'Filatelija | Srbija i ex YU', 'Filatelija | Ostalo', 'Kinder i druge figurice', 'Kovani novac | Antika', 'Kovani novac | Evropa', 'Merchandise', 'Militarija | Dokumenta, fotografije', 'Militarija | Knjige i časopisi', 'Militarija | Kolekcionarsko oružje domaće', 'Militarija | Odeća domaća', 'Militarija | Ordenje, činovi, oznake domaće', 'Militarija | Ordenje, činovi, oznake strano', 'Militarija | Ostalo', 'Modeli | Automobili', 'Modeli | Kamioni i prikolice', 'Modeli | Ostalo', 'Nevažeće ulaznice i pozivnice', 'Papirni novac | Evropa', 'Papirni novac | Ostatak sveta', 'Papirni novac | Srbija i ex YU', 'Razglednice | Domaće', 'Razglednice | Strane', 'Sličice i albumi', 'Stakleni predmeti', 'Stare fotografije', 'Stari posteri i plakati', 'Suveniri', 'Zastave', 'Značke | Domaće', 'Značke | Strane', 'Ostalo'],
  'Kompjuteri | Desktop': ['Kuleri', 'Štampači | Kertridži InkJet', 'Tastature', 'Ostalo'],
  'Konzole i igrice': ['Igrice za PC', 'Nintendo | Igrice', 'Sega | Igrice', 'Sony PlayStation', 'Sony Playstation | Igrice', 'Xbox', 'Xbox | Igrice'],
  'Kupatilo i oprema': ['Galanterija'],
  'Lov i ribolov': ['Lov | Lovački noževi preklopni', 'Ribolov | Ostalo'],
  'Mama i beba': ['Ostalo'],
  'Nakit i dragocenosti': ['Nakit | Broševi', 'Nakit | Narukvice', 'Nakit | Prstenje', 'Ostalo'],
  'Nega i lična higijena': [],
  'Ostali aparati i oprema': [],
  'Odeća | Muška': ['Košulje'],
  'Odeća | Ženska': ['Farmerke', 'Haljine', 'Pantalone'],
  'Otkup': ['Otkup knjiga, stripova i ploča', 'Otkup ostalo'],
  'Poslovna oprema': ['Kancelarija | Pribor i materijali'],
  'Sport i razonoda': ['Fudbal', 'Maskenbalska oprema', 'Sportska oprema', 'Tenis', 'Zabava i sport', 'Ostalo'],
  'Sve za školu': ['Školska lektira', 'Školski pribor', 'Udžbenici | Fakultet', 'Udžbenici | Osnovna škola', 'Udžbenici | Srednja škola'],
  'TV i Video': ['Originalni DVD i Blu-ray', 'Projektori', 'Ostalo'],
  'Umetnička dela i materijali': ['Ramovi za slike', 'Slike', 'Slike starije od 20 godina'],
  'Uređenje kuće': ['Figure', 'Razne kućne stvari', 'Ukrasne stvari'],
}

const slugify = (t) =>
  t
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Slug podkategorije mora biti jedinstven (ista ruta kao kategorija); duplikati dobijaju slug nadkategorije
const subs = Object.entries(TREE).flatMap(([cat, list]) => list.map((name) => ({ cat, name, slug: slugify(name) })))
const count = {}
for (const s of subs) count[s.slug] = (count[s.slug] ?? 0) + 1
for (const s of subs) if (count[s.slug] > 1) s.slug = `${slugify(s.cat)}-${s.slug}`
const all = [...Object.keys(TREE).map(slugify), ...subs.map((s) => s.slug)]
const dup = all.filter((s, i) => all.indexOf(s) !== i)
if (dup.length) throw new Error(`Slug kolizije: ${[...new Set(dup)].join(', ')}`)

const apply = process.argv.includes('--apply')
console.log(`Kategorija: ${Object.keys(TREE).length}, podkategorija: ${subs.length}${apply ? '' : ' (pregled, ništa se ne upisuje)'}`)
if (!apply) {
  console.log('Duplirani nazivi sa prefiksom:', subs.filter((s) => count[slugify(s.name)] > 1).map((s) => s.slug).join(', '))
  process.exit(0)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})
// Postojeći dokumenti (uneti ručno u Studiju) se zadržavaju, samo se po slug-u preuzima njihov _id
const existing = await client.fetch(`*[_type in ["category", "subcategory"]]{ _id, _type, "slug": slug.current }`)
const idFor = (type, slug) => existing.find((d) => d._type === type && d.slug === slug)?._id ?? `${type}-${slug}`

let tx = client.transaction()
for (const name of Object.keys(TREE)) {
  tx = tx.createOrReplace({
    _id: idFor('category', slugify(name)),
    _type: 'category',
    name,
    slug: { _type: 'slug', current: slugify(name) },
  })
}
for (const s of subs) {
  tx = tx.createOrReplace({
    _id: idFor('subcategory', s.slug),
    _type: 'subcategory',
    name: s.name,
    slug: { _type: 'slug', current: s.slug },
    category: { _type: 'reference', _ref: idFor('category', slugify(s.cat)) },
  })
}
await tx.commit()
console.log('Upisano.')
