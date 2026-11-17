import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/admin/auth'
import { addProductImage, isUploadFile } from '@/lib/admin/images'
import { row } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Upload slika običnim HTTP POST-om (umesto server akcije): iza Passenger-a server akcije
// često vrate prazan 500, a ovde uvek vraćamo JSON sa pravom porukom greške.
export async function POST(req: Request) {
  const json = (body: { ok?: string; error?: string }, status = 200) =>
    NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

  try {
    if (!(await getCurrentUser())) return json({ error: 'Sesija je istekla. Prijavi se ponovo.' }, 401)

    const form = await req.formData()
    const pid = Number(form.get('id'))
    if (!Number.isInteger(pid) || pid <= 0 || !(await row('SELECT id FROM products WHERE id = ?', [pid]))) {
      return json({ error: 'Proizvod ne postoji.' }, 404)
    }
    const files = form.getAll('images').filter(isUploadFile)
    if (files.length === 0) return json({ error: 'Izaberi bar jednu sliku.' }, 400)

    const errors: string[] = []
    for (const file of files.slice(0, 20)) {
      try {
        const e = await addProductImage(pid, file)
        if (e) errors.push(e)
      } catch (err) {
        console.error('[upload] greška:', err)
        errors.push(`${file.name}: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}`)
      }
    }
    return errors.length ? json({ error: errors.join('; ') }, 500) : json({ ok: `Dodato slika: ${files.length}` })
  } catch (err) {
    console.error('[upload] neočekivana greška:', err)
    return json({ error: `Greška na serveru: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}` }, 500)
  }
}
