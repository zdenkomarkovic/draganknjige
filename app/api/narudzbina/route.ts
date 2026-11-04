import { NextResponse } from 'next/server'
import { sendOrderEmail } from '@/lib/email/sendOrder'
import { rows } from '@/lib/db'
import { createOrder } from '@/lib/db/queries'
import type { CartItem, OrderFormData } from '@/types/shop'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { form, items: clientItems } = body as { form: OrderFormData; items: CartItem[] }

    if (!form || !Array.isArray(clientItems) || clientItems.length === 0 || clientItems.length > 100) {
      return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 })
    }

    // Nazive i cene uzimamo iz baze, nikad od klijenta (korpa je u browseru i može da se izmeni)
    const ids = [...new Set(clientItems.map((i) => Number(i._id)).filter((n) => Number.isInteger(n) && n > 0))]
    const found = ids.length
      ? await rows<{ id: number; name: string; slug: string; price: number | null; sale_price: number | null }>(
          `SELECT id, name, slug, price, sale_price FROM products WHERE id IN (?) AND visible = 1 AND in_stock = 1`,
          [ids],
        )
      : []
    const byId = new Map(found.map((p) => [String(p.id), p]))

    const items: CartItem[] = []
    for (const ci of clientItems) {
      const p = byId.get(String(ci._id))
      if (!p || (p.sale_price ?? p.price) == null) {
        return NextResponse.json({ error: `Proizvod "${ci.name}" više nije dostupan` }, { status: 409 })
      }
      // Svaki proizvod je jedinstven (1 komad); duplikate ignorišemo
      if (items.some((i) => i._id === String(p.id))) continue
      items.push({
        _id: String(p.id),
        name: p.name,
        slug: p.slug,
        price: p.price ?? undefined,
        salePrice: p.sale_price ?? undefined,
        quantity: 1,
      })
    }
    const total = items.reduce((sum, i) => sum + (i.salePrice ?? i.price ?? 0) * i.quantity, 0)

    // Čuvanje narudžbine ne sme da blokira slanje mejla
    try {
      await createOrder({
        ime: form.ime,
        prezime: form.prezime,
        email: form.email,
        telefon: form.telefon,
        adresa: form.adresa,
        grad: form.grad,
        postanskiBroj: form.postanskiBroj,
        napomena: form.napomena,
        marketingConsent: form.marketingConsent === true,
        items: items.map((i) => ({
          productId: Number(i._id),
          name: i.name,
          quantity: i.quantity,
          price: i.salePrice ?? i.price ?? 0,
        })),
        total,
      })
    } catch (err) {
      console.error('Greška pri čuvanju narudžbine u bazu:', err)
    }

    await sendOrderEmail(form, items, total)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Greška pri slanju narudzbine:', err)
    return NextResponse.json({ error: 'Greška pri slanju narudzbine' }, { status: 500 })
  }
}
