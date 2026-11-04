import { getCustomerRows } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

interface OrderRow {
  email: string
  ime?: string
  prezime?: string
  telefon?: string
  grad?: string
  marketingConsent?: boolean
  createdAt?: string
  total?: number
}

function csvCell(v: unknown) {
  const s = String(v ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

// GET /api/kupci?key=ADMIN_EXPORT_KEY[&marketing=1]
// marketing=1 vraca samo kupce koji su dali saglasnost za marketinske mejlove
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = process.env.ADMIN_EXPORT_KEY

  if (!secret || searchParams.get('key') !== secret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const onlyMarketing = searchParams.get('marketing') === '1'

  const orders: OrderRow[] = (await getCustomerRows()).map((o) => ({ ...o, marketingConsent: !!o.marketingConsent }))

  // Jedan red po kupcu (po email-u), sa brojem narudzbina i ukupnom potrosnjom
  const byEmail = new Map<string, OrderRow & { orders: number; spent: number; consent: boolean }>()
  for (const o of orders) {
    const key = o.email.trim().toLowerCase()
    const prev = byEmail.get(key)
    if (prev) {
      prev.orders += 1
      prev.spent += o.total ?? 0
      prev.consent = prev.consent || o.marketingConsent === true
    } else {
      byEmail.set(key, {
        ...o,
        email: key,
        orders: 1,
        spent: o.total ?? 0,
        consent: o.marketingConsent === true,
      })
    }
  }

  const rows = [...byEmail.values()].filter((c) => !onlyMarketing || c.consent)

  const header = ['Email', 'Ime', 'Prezime', 'Telefon', 'Grad', 'Broj narudzbina', 'Potroseno (RSD)', 'Saglasnost za marketing', 'Poslednja narudzbina']
  const lines = rows.map((c) =>
    [c.email, c.ime, c.prezime, c.telefon, c.grad, c.orders, c.spent, c.consent ? 'da' : 'ne', c.createdAt]
      .map(csvCell)
      .join(',')
  )

  const csv = '﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kupci-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
