import { defineField, defineType } from 'sanity'

export const orderType = defineType({
  name: 'order',
  title: 'Narudžbina',
  type: 'document',
  fields: [
    defineField({ name: 'createdAt', title: 'Datum', type: 'datetime', readOnly: true }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Nova', value: 'nova' },
          { title: 'Potvrđena', value: 'potvrdjena' },
          { title: 'Poslata', value: 'poslata' },
          { title: 'Završena', value: 'zavrsena' },
          { title: 'Otkazana', value: 'otkazana' },
        ],
      },
      initialValue: 'nova',
    }),
    defineField({ name: 'ime', title: 'Ime', type: 'string' }),
    defineField({ name: 'prezime', title: 'Prezime', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'telefon', title: 'Telefon', type: 'string' }),
    defineField({ name: 'adresa', title: 'Adresa', type: 'string' }),
    defineField({ name: 'grad', title: 'Grad', type: 'string' }),
    defineField({ name: 'postanskiBroj', title: 'Poštanski broj', type: 'string' }),
    defineField({ name: 'napomena', title: 'Napomena', type: 'text', rows: 3 }),
    defineField({
      name: 'marketingConsent',
      title: 'Saglasnost za marketinške mejlove',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'items',
      title: 'Proizvodi',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'productId', title: 'ID proizvoda', type: 'string' }),
            defineField({ name: 'name', title: 'Naziv', type: 'string' }),
            defineField({ name: 'quantity', title: 'Količina', type: 'number' }),
            defineField({ name: 'price', title: 'Cena', type: 'number' }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'quantity' },
          },
        },
      ],
    }),
    defineField({ name: 'subtotal', title: 'Iznos porudžbine (RSD)', type: 'number' }),
    defineField({ name: 'total', title: 'Ukupno (RSD)', type: 'number' }),
  ],
  orderings: [
    { title: 'Najnovije prvo', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
  ],
  preview: {
    select: { ime: 'ime', prezime: 'prezime', total: 'total', date: 'createdAt' },
    prepare: ({ ime, prezime, total, date }) => ({
      title: `${ime ?? ''} ${prezime ?? ''}`.trim(),
      subtitle: `${total ?? 0} RSD · ${date ? new Date(date).toLocaleDateString('sr-RS') : ''}`,
    }),
  },
})
