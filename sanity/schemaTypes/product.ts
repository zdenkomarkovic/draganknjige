import { defineField, defineType } from 'sanity'
import { seoFields, seoGroups } from './seoFields'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[šŠ]/g, 's')
    .replace(/[čČ]/g, 'c')
    .replace(/[ćĆ]/g, 'c')
    .replace(/[žŽ]/g, 'z')
    .replace(/[đĐ]/g, 'dj')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
}

export const productType = defineType({
  name: 'product',
  title: 'Proizvod',
  type: 'document',
  groups: seoGroups,
  fields: [
    defineField({
      name: 'name',
      title: 'Naziv',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        slugify: async (input, _schemaType, context) => {
          const baseSlug = slugify(input)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc = context.parent as any
          const docId = (doc?._id ?? '').replace('drafts.', '')

          const client = context.getClient({ apiVersion: '2024-01-01' })
          const existing = await client.fetch<number>(
            `count(*[_type == "product" && slug.current == $slug && _id != $id && _id != $draftId])`,
            { slug: baseSlug, id: docId, draftId: `drafts.${docId}` },
          )

          if (existing === 0) return baseSlug
          // Append short suffix from document ID to guarantee uniqueness
          return `${baseSlug}-${docId.slice(-6)}`
        },
        isUnique: async (slug, context) => {
          const client = context.getClient({ apiVersion: '2024-01-01' })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const docId = ((context as any).document?._id ?? '').replace('drafts.', '')
          const count = await client.fetch<number>(
            `count(*[_type == "product" && slug.current == $slug && _id != $id && _id != $draftId])`,
            { slug, id: docId, draftId: `drafts.${docId}` },
          )
          return count === 0
        },
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Kategorija',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'subcategory',
      title: 'Podkategorija',
      type: 'reference',
      to: [{ type: 'subcategory' }],
      options: {
        disableNew: true,
        // Nude se samo podkategorije izabrane kategorije
        filter: ({ document }) => ({
          filter: 'category._ref == $category',
          params: { category: (document.category as { _ref?: string } | undefined)?._ref ?? '' },
        }),
      },
      hidden: ({ document }) => !document?.category,
      validation: (r) =>
        r.custom(async (value, context) => {
          const ref = (value as { _ref?: string } | undefined)?._ref
          if (!ref) return true
          const category = (context.document?.category as { _ref?: string } | undefined)?._ref
          const sub = await context
            .getClient({ apiVersion: '2024-01-01' })
            .fetch<{ category?: string } | null>(`*[_id == $id][0]{ "category": category._ref }`, { id: ref })
          return sub?.category === category ? true : 'Podkategorija ne pripada izabranoj kategoriji.'
        }),
    }),
    defineField({
      name: 'price',
      title: 'Cena (RSD)',
      type: 'number',
      validation: (r) => r.positive(),
    }),
    defineField({
      name: 'salePrice',
      title: 'Akcijska cena (RSD)',
      type: 'number',
      validation: (r) => r.positive(),
    }),
    defineField({
      name: 'images',
      title: 'Slike',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt tekst', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Kratak tekst ispod cene',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Prikazuje se na stranici proizvoda ispod cene. Podržava podebljan tekst.',
    }),
    defineField({
      name: 'description',
      title: 'Opis',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kratak opis (prikazuje se na kartici)',
      type: 'text',
      rows: 3,
      description: 'Jedna do dve rečenice o najbitnijem za ovo ulje. Prikazuje se na kartici proizvoda.',
      validation: (r) => r.max(160).warning('Preporučeno do 160 karaktera da kartica ostane uredna.'),
    }),
    defineField({
      name: 'inStock',
      title: 'Na stanju',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Istaknuti proizvod',
      type: 'boolean',
      initialValue: false,
    }),
    ...seoFields,
  ],
  preview: {
    select: { title: 'name', subtitle: 'price', media: 'images.0' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare({ title, subtitle, media }: any) {
      return { title, subtitle: subtitle ? `${subtitle} RSD` : '', media }
    },
  },
})
