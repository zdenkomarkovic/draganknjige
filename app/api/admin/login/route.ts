import { NextResponse } from 'next/server'
import { loginWithToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

// Prijava običnim HTTP POST-om (umesto server akcije): kolačić ide direktno u odgovor,
// a preusmeravanje je običan 303 sa relativnim Location (radi i iza Passenger-a/proxy-ja).
export async function POST(req: Request) {
  const form = await req.formData()
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')

  let result: Awaited<ReturnType<typeof loginWithToken>>
  try {
    result = await loginWithToken(email, password)
  } catch (err) {
    console.error('admin login failed', err)
    return new NextResponse(null, { status: 303, headers: { Location: '/admin/login/?e=server' } })
  }

  if (!result.ok) {
    return new NextResponse(null, { status: 303, headers: { Location: `/admin/login/?e=${result.locked ? 'locked' : 'bad'}` } })
  }

  const res = new NextResponse(null, { status: 303, headers: { Location: '/admin/', 'Cache-Control': 'no-store' } })
  res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions)
  return res
}
