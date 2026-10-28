import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/metadata'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ContactInfo from '@/components/content/ContactInfo'

export const metadata: Metadata = buildMetadata({
  title: "Kontakt",
  url: '/kontakt/',
})

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumbs items={[{ name: "Kontakt" }]} />
      <h1 className="text-3xl font-semibold mb-8 font-serif">Kontakt</h1>
      <div className="page-content max-w-4xl">
        <h3>Stojimo Vam na raspolaganju za sva Vaša pitanja!</h3>
        <p>Budite slobodni da nas kontaktirate telefonom, Viber-om, WhatsApp-om ili emailom.</p>
        <h3>Često postavljena pitanja</h3>
        <p>Da li šaljete na adresu?</p>
        <p>Naravno, knjige šaljemo poštom direktno na vašu adresu.</p>
        <p>Da li mogu da platim pouzećem?</p>
        <p>Možete, plaćanje pouzećem prilikom preuzimanja pošiljke.</p>
        <p>Kako mogu da poručim?</p>
        <p>Putem sajta ili telefonom.</p>
        <ContactInfo />
      </div>
    </main>
  )
}
