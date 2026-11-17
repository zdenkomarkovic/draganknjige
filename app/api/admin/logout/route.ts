import { NextResponse } from 'next/server'
import { destroySession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const token = req.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)

  await destroySession(token).catch((err) => console.error('admin logout failed', err))

  const res = new NextResponse(null, { status: 303, headers: { Location: '/admin/login/', 'Cache-Control': 'no-store' } })
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  return res
}
