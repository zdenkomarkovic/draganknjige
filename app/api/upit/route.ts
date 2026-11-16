import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPool, row } from '@/lib/db'

const inquirySchema = z.object({
  productId: z.coerce.number().int().positive(),
  ime: z.string().trim().min(2, 'Unesite ime').max(100),
  telefon: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s\-().\/]{6,20}$/, 'Unesite ispravan broj telefona'),
  email: z.string().trim().email('Unesite ispravnu email adresu').max(255).optional().or(z.literal('')),
  poruka: z.string().trim().min(5, 'Poruka je prekratka').max(2000, 'Poruka je predugačka'),
  website: z.string().optional(), // honeypot: botovi ga popune
})

// Grubo ograničenje po IP adresi (u memoriji procesa): 5 upita na 10 minuta
const hits = new Map<string, number[]>()
function tooMany(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 5
}

export async function POST(req: Request) {
  try {
    const parsed = inquirySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Neispravni podaci' }, { status: 400 })
    }
    const d = parsed.data
    if (d.website) return NextResponse.json({ ok: true }) // bot: tiho ignorišemo

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (tooMany(ip)) {
      return NextResponse.json({ error: 'Previše poruka. Pokušajte kasnije ili nas pozovite telefonom.' }, { status: 429 })
    }

    // Naziv proizvoda uzimamo iz baze, ne od klijenta
    const product = await row<{ id: number; name: string; slug: string }>(
      'SELECT id, name, slug FROM products WHERE id = ? AND visible = 1',
      [d.productId],
    )
    if (!product) return NextResponse.json({ error: 'Proizvod nije pronađen' }, { status: 404 })

    await getPool().query(
      'INSERT INTO inquiries (product_id, product_name, product_slug, ime, telefon, email, poruka) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product.id, product.name, product.slug, d.ime, d.telefon, d.email || null, d.poruka],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Greška pri čuvanju upita:', err)
    return NextResponse.json({ error: 'Greška pri slanju poruke' }, { status: 500 })
  }
}
