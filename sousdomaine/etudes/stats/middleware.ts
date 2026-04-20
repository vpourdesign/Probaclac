import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'dash_auth'
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'probaclac2024'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow the login page and its POST action
  if (pathname === '/login' || pathname === '/api/auth/login') return NextResponse.next()

  // Check auth cookie
  if (req.cookies.get(COOKIE)?.value === PASSWORD) return NextResponse.next()

  // Redirect to login
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
