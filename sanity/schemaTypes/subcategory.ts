import { defineField, defineType } from 'sanity'
import { AutoSlugInput } from './AutoSlugInput'

export const subcategoryType = defineType({
  name: 'subcategory',
  title: 'Podkategorija',
  type: 'document',
  fields: [
    defineField({
      name: 'category',
      title: 'Kategorija',
      type: 'reference',
      to: [{ type: 'category' }],
      options: { disableNew: true },
      description: 'Podkategorija pripada samo ovoj kategoriji.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'name',
      title: 'Naslov',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      components: { input: AutoSlugInput },
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'category.name' },
  },
})
