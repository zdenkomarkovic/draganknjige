import { defineField, defineType } from 'sanity'
import { AutoSlugInput } from './AutoSlugInput'

export const categoryType = defineType({
  name: 'category',
  title: 'Kategorija',
  type: 'document',
  fields: [
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
    select: { title: 'name', subtitle: 'slug.current' },
  },
})
