import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { unsealData } from 'iron-session'

const COOKIE_NAME = 'apt-mgr-session'
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const sessionSecret = process.env.SESSION_SECRET
  if (!sessionSecret || sessionSecret.length < 32) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'server_config')
    return NextResponse.redirect(url)
  }

  const sealedSession = req.cookies.get(COOKIE_NAME)?.value
  if (!sealedSession) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const session = await unsealData<{ isLoggedIn?: boolean }>(sealedSession, {
      password: sessionSecret,
    })

    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
