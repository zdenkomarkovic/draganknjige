import { NextResponse, type NextRequest } from 'next/server'

// Grubi filter: bez kolačića sesije nema pristupa dashboardu.
// Prava provera sesije (u bazi) je u requireUser() na svakoj stranici i akciji.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLogin = pathname === '/admin/login' || pathname === '/admin/login/'
  if (!isLogin && !req.cookies.get('dk_session')) {
    return NextResponse.redirect(new URL('/admin/login/', req.url))
  }
  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
