import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { unsealData } from 'iron-session'

const PASSWORD = process.env.SESSION_SECRET || 'apartment-manager-secret-key-32chars!!'
const COOKIE   = 'apt-mgr-session'
const PUBLIC   = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') return NextResponse.next()

  const seal = req.cookies.get(COOKIE)?.value
  if (!seal) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const data = await unsealData<{ isLoggedIn?: boolean }>(seal, { password: PASSWORD })
    if (!data.isLoggedIn) return NextResponse.redirect(new URL('/login', req.url))
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}