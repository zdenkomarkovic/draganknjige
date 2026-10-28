import { NextResponse } from 'next/server'
import { sendOrderEmail } from '@/lib/email/sendOrder'
import { sanityWriteClient } from '@/lib/sanity/writeClient'
import type { CartItem, OrderFormData } from '@/types/shop'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { form, items, totalPrice } = body as {
      form: OrderFormData
      items: CartItem[]
      totalPrice: number
    }

    if (!form || !items || items.length === 0) {
      return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 })
    }

    // Cuvanje narudzbine ne sme da blokira slanje mejla
    try {
      await sanityWriteClient.create({
        _type: 'order',
        createdAt: new Date().toISOString(),
        status: 'nova',
        ime: form.ime,
        prezime: form.prezime,
        email: form.email,
        telefon: form.telefon,
        adresa: form.adresa,
        grad: form.grad,
        postanskiBroj: form.postanskiBroj,
        napomena: form.napomena ?? '',
        marketingConsent: form.marketingConsent === true,
        items: items.map((i) => ({
          _type: 'object',
          _key: i._id,
          productId: i._id,
          name: i.name,
          quantity: i.quantity,
          price: i.salePrice ?? i.price ?? 0,
        })),
        subtotal: totalPrice,
        total: totalPrice,
      })
    } catch (err) {
      console.error('Greška pri čuvanju narudžbine u Sanity:', err)
    }

    await sendOrderEmail(form, items, totalPrice)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Greška pri slanju narudzbine:', err)
    return NextResponse.json({ error: 'Greška pri slanju narudzbine' }, { status: 500 })
  }
}
