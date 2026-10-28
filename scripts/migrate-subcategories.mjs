// Prebacuje stare podkategorije (dokumenti "category" sa poljem parent) u novi tip "subcategory".
// Proizvodima postavlja category = nadkategorija i subcategory = podkategorija, pa briše stare dokumente.
// Pokretanje (samo pregled):  node --env-file=.env.local scripts/migrate-subcategories.mjs
// Pokretanje (izmene u bazi): node --env-file=.env.local scripts/migrate-subcategories.mjs --apply
import { createClient } from '@sanity/client'

const apply = process.argv.includes('--apply')
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const olds = await client.fetch(
  `*[_type == "category" && defined(parent)]{ _id, name, slug, "parent": parent._ref }`
)
console.log(`Starih podkategorija: ${olds.length}${apply ? '' : ' (pregled, ništa se ne menja)'}`)

for (const old of olds) {
  const newId = `subcategory-${old.slug.current}`
  const products = await client.fetch(`*[_type == "product" && category._ref == $id]._id`, { id: old._id })
  console.log(`- ${old.name}: ${products.length} proizvoda -> ${newId}`)
  if (!apply) continue

  await client.createOrReplace({
    _id: newId,
    _type: 'subcategory',
    name: old.name,
    slug: old.slug,
    category: { _type: 'reference', _ref: old.parent },
  })
  let tx = client.transaction()
  for (const id of products) {
    tx = tx.patch(id, {
      set: {
        category: { _type: 'reference', _ref: old.parent },
        subcategory: { _type: 'reference', _ref: newId },
      },
    })
  }
  await tx.commit()
  await client.delete(old._id)
}
console.log('Gotovo.')
